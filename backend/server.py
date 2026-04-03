from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from supabase import create_client, Client
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase connection with service role key (for admin operations)
supabase_url = os.environ['SUPABASE_URL']
supabase_service_key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
supabase: Client = create_client(supabase_url, supabase_service_key)

# Admin emails
ADMIN_EMAILS = ["tomacwin9961@gmail.com", "rituchaubey1984@gmail.com", "prepixo.official@gmail.com"]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =====================================================
# MODELS
# =====================================================

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class MentorApplicationCreate(BaseModel):
    user_id: str
    full_name: str
    mobile_number: str
    email: str
    exam_expertise: List[str]
    college_name: str
    course: str
    display_college_publicly: bool = True
    tagline: str
    achievements: str
    about_me: str
    college_id_url: str
    exam_result_url: str

class MentorApplication(BaseModel):
    id: str
    user_id: str
    full_name: str
    mobile_number: str
    email: str
    exam_expertise: List[str]
    college_name: str
    course: str
    display_college_publicly: bool
    tagline: str
    achievements: str
    about_me: str
    college_id_url: str
    exam_result_url: str
    status: str
    admin_notes: Optional[str] = None
    created_at: str
    updated_at: str
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None

class ApproveRejectRequest(BaseModel):
    admin_email: str
    admin_notes: Optional[str] = None

class MentorProfile(BaseModel):
    id: str
    user_id: str
    full_name: str
    profile_photo_url: Optional[str] = None
    tagline: str
    achievements: str
    about_me: str
    college_name: Optional[str] = None
    course: Optional[str] = None
    display_college: bool
    exam_expertise: List[str]
    expertise_tags: Optional[List[str]] = None
    media_urls: Optional[List[str]] = None
    is_active: bool
    is_verified: bool
    total_sessions: int
    rating: float
    total_reviews: int
    created_at: str


# =====================================================
# BASIC ROUTES
# =====================================================

@api_router.get("/")
async def root():
    return {"message": "Prepixo API - Mentorship Platform"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# =====================================================
# ADMIN ROUTES
# =====================================================

@api_router.get("/admin/check")
async def check_admin(email: str):
    """Check if user is an admin"""
    is_admin = email in ADMIN_EMAILS
    return {"is_admin": is_admin, "email": email}

@api_router.get("/admin/applications")
async def get_all_applications(admin_email: str):
    """Get all mentor applications (admin only) - excludes rejected applications"""
    if admin_email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    
    try:
        # Fetch only pending and approved applications (exclude rejected)
        response = supabase.table('mentor_applications').select('*').neq('status', 'rejected').order('created_at', desc=True).execute()
        return {"success": True, "applications": response.data}
    except Exception as e:
        logger.error(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching applications: {str(e)}")

@api_router.post("/admin/applications/{application_id}/approve")
async def approve_application(application_id: str, request: ApproveRejectRequest):
    """Approve a mentor application and create profile with default ratings"""
    if request.admin_email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    
    profile_created = False
    profile_response = None
    
    try:
        # Get the application
        app_response = supabase.table('mentor_applications').select('*').eq('id', application_id).execute()
        
        if not app_response.data:
            raise HTTPException(status_code=404, detail="Application not found")
        
        application = app_response.data[0]
        user_id = application['user_id']
        
        # Check if profile already exists
        existing_profile = supabase.table('mentor_profiles').select('id').eq('user_id', user_id).execute()
        
        # Generate random rating between 4.0 and 4.9
        import random
        random_rating = round(random.uniform(4.0, 4.9), 1)
        random_reviews = random.randint(5, 12)
        
        # Create profile with default ratings
        profile_data = {
            'user_id': user_id,
            'full_name': application.get('full_name', 'Mentor'),
            'tagline': application.get('tagline', 'Expert Mentor'),
            'exam_expertise': application.get('exam_expertise', ['JEE']),
            'is_active': True,
            'is_verified': True,
            'rating': random_rating,
            'total_reviews': random_reviews,
            'total_sessions': 0
        }
        
        if existing_profile.data:
            # Update existing profile
            profile_response = supabase.table('mentor_profiles').update(profile_data).eq('user_id', user_id).execute()
            logger.info(f"Updated existing mentor profile for user {user_id}")
            profile_created = True
        else:
            # Create new profile
            profile_response = supabase.table('mentor_profiles').insert(profile_data).execute()
            logger.info(f"Created new mentor profile for user {user_id} with rating {random_rating}")
            profile_created = True
        
        # Create default ₹99 service for the mentor
        if profile_response.data:
            mentor_profile_id = profile_response.data[0]['id']
            try:
                service_data = {
                    'mentor_id': mentor_profile_id,
                    'title': '1:1 Mentorship Session',
                    'description': 'Personalized guidance and doubt clearing session',
                    'price': 99,
                    'duration_minutes': 30,
                    'is_active': True
                }
                supabase.table('mentor_services').insert(service_data).execute()
                logger.info(f"Created default ₹99 service for mentor {mentor_profile_id}")
            except Exception as service_error:
                logger.warning(f"Could not create service: {service_error}")
        
        # Update application status
        try:
            update_response = supabase.table('mentor_applications').update({
                'status': 'approved',
                'admin_notes': request.admin_notes or 'Approved by admin',
                'reviewed_at': datetime.utcnow().isoformat(),
                'reviewed_by': user_id
            }).eq('id', application_id).execute()
            
            logger.info(f"Application {application_id} approved by {request.admin_email}")
        except Exception as trigger_error:
            # Ignore broken trigger error
            error_str = str(trigger_error)
            if '42703' in error_str and 'college' in error_str:
                logger.warning(f"Ignoring broken trigger error: {error_str}")
                pass
            else:
                raise
        
        return {
            "success": True,
            "message": "Application approved and mentor profile created",
            "profile": profile_response.data if profile_response else None,
            "rating": random_rating,
            "reviews": random_reviews
        }
        
    except Exception as e:
        error_msg = str(e)
        
        # If the trigger error happens but profile was created, return success
        if '42703' in error_msg and 'college' in error_msg and profile_created:
            logger.warning(f"Trigger error occurred but profile was already created: {error_msg}")
            return {
                "success": True,
                "message": "Application approved and mentor profile created",
                "profile": profile_response.data if profile_response else None
            }
        
        logger.error(f"Error approving application: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error approving application: {error_msg}")

@api_router.post("/admin/applications/{application_id}/reject")
async def reject_application(application_id: str, request: ApproveRejectRequest):
    """Reject a mentor application"""
    if request.admin_email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    
    try:
        # Get the application first
        app_response = supabase.table('mentor_applications').select('user_id').eq('id', application_id).execute()
        
        if not app_response.data:
            raise HTTPException(status_code=404, detail="Application not found")
        
        application = app_response.data[0]
        
        # Update application status
        response = supabase.table('mentor_applications').update({
            'status': 'rejected',
            'admin_notes': request.admin_notes or 'Rejected by admin',
            'reviewed_at': datetime.utcnow().isoformat(),
            'reviewed_by': application['user_id'],  # Use applicant's user_id instead of admin email
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', application_id).execute()
        
        logger.info(f"Application {application_id} rejected by {request.admin_email}")
        
        return {
            "success": True,
            "message": "Application rejected",
            "application": response.data
        }
        
    except Exception as e:
        logger.error(f"Error rejecting application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error rejecting application: {str(e)}")


# =====================================================
# MENTOR ROUTES
# =====================================================

@api_router.post("/mentor/apply")
async def submit_mentor_application(application: MentorApplicationCreate):
    """Submit a mentor application"""
    try:
        # Check if user already has an application
        existing = supabase.table('mentor_applications').select('id').eq('user_id', application.user_id).execute()
        
        if existing.data:
            raise HTTPException(status_code=400, detail="You have already submitted an application")
        
        # Create application
        app_data = application.dict()
        app_data['status'] = 'pending'
        app_data['created_at'] = datetime.utcnow().isoformat()
        app_data['updated_at'] = datetime.utcnow().isoformat()
        
        response = supabase.table('mentor_applications').insert(app_data).execute()
        
        logger.info(f"New mentor application submitted by {application.email}")
        
        return {
            "success": True,
            "message": "Application submitted successfully",
            "application": response.data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error submitting application: {str(e)}")

@api_router.get("/mentors")
async def get_mentors(exam_filter: Optional[str] = None):
    """Get all approved mentors"""
    try:
        query = supabase.table('mentor_profiles').select('*').eq('is_active', True)
        
        if exam_filter:
            query = query.contains('exam_expertise', [exam_filter])
        
        response = query.order('rating', desc=True).execute()
        
        return {
            "success": True,
            "mentors": response.data
        }
        
    except Exception as e:
        logger.error(f"Error fetching mentors: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching mentors: {str(e)}")

@api_router.get("/mentors/{mentor_id}")
async def get_mentor_details(mentor_id: str):
    """Get details of a specific mentor"""
    try:
        response = supabase.table('mentor_profiles').select('*').eq('id', mentor_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        # Get services for this mentor
        services_response = supabase.table('mentor_services').select('*').eq('mentor_id', mentor_id).eq('is_active', True).execute()
        
        mentor_data = response.data[0]
        mentor_data['services'] = services_response.data if services_response.data else []
        
        return {
            "success": True,
            "mentor": mentor_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching mentor: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching mentor: {str(e)}")


# =====================================================
# MENTOR SESSIONS & BOOKING ROUTES
# =====================================================

class SessionBookingRequest(BaseModel):
    student_id: str
    mentor_id: str
    service_title: str = "1:1 Mentorship Session"
    payment_amount: int = 9900  # ₹99 in paise

@api_router.post("/sessions/create")
async def create_session(booking: SessionBookingRequest):
    """Create a mentoring session booking"""
    try:
        # Create default service if doesn't exist
        service_check = supabase.table('mentor_services').select('id').eq('mentor_id', booking.mentor_id).eq('is_active', True).execute()
        
        service_id = None
        if not service_check.data:
            # Create default service
            service_data = {
                'mentor_id': booking.mentor_id,
                'title': booking.service_title,
                'description': 'One-on-one mentorship session',
                'price': 99,
                'is_active': True
            }
            service_response = supabase.table('mentor_services').insert(service_data).execute()
            service_id = service_response.data[0]['id']
        else:
            service_id = service_check.data[0]['id']
        
        # Create session
        session_data = {
            'student_id': booking.student_id,
            'mentor_id': booking.mentor_id,
            'service_id': service_id,
            'payment_amount': booking.payment_amount,
            'payment_status': 'pending',
            'session_status': 'pending'
        }
        
        response = supabase.table('mentor_sessions').insert(session_data).execute()
        
        return {
            "success": True,
            "session": response.data[0]
        }
        
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class SessionPaymentUpdate(BaseModel):
    payment_id: str
    payment_status: str = "completed"

@api_router.post("/sessions/{session_id}/payment")
async def update_session_payment(session_id: str, payment: SessionPaymentUpdate):
    """Update session payment status"""
    try:
        response = supabase.table('mentor_sessions').update({
            'payment_id': payment.payment_id,
            'payment_status': payment.payment_status,
            'session_status': 'scheduled' if payment.payment_status == 'completed' else 'pending'
        }).eq('id', session_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "success": True,
            "session": response.data[0]
        }
        
    except Exception as e:
        logger.error(f"Error updating payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/sessions/student/{student_id}")
async def get_student_sessions(student_id: str):
    """Get all sessions for a student"""
    try:
        response = supabase.table('mentor_sessions').select('''
            *,
            mentor_profiles!mentor_sessions_mentor_id_fkey (
                id,
                full_name,
                profile_photo_url,
                tagline
            )
        ''').eq('student_id', student_id).eq('payment_status', 'completed').order('created_at', desc=True).execute()
        
        return {
            "success": True,
            "sessions": response.data
        }
        
    except Exception as e:
        logger.error(f"Error fetching student sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/sessions/mentor/{user_id}")
async def get_mentor_sessions(user_id: str):
    """Get all paid sessions for a mentor (by user_id)"""
    try:
        # First get mentor profile id
        profile_response = supabase.table('mentor_profiles').select('id').eq('user_id', user_id).execute()
        
        if not profile_response.data:
            return {"success": True, "sessions": []}
        
        mentor_id = profile_response.data[0]['id']
        
        # Get sessions
        sessions_response = supabase.table('mentor_sessions').select('''
            *,
            student:student_id (
                email
            )
        ''').eq('mentor_id', mentor_id).eq('payment_status', 'completed').order('created_at', desc=True).execute()
        
        # Get student details from auth.users table
        sessions = sessions_response.data or []
        for session in sessions:
            try:
                user_response = supabase.auth.admin.get_user_by_id(session['student_id'])
                if user_response.user:
                    session['student_name'] = user_response.user.email.split('@')[0].capitalize()
                    session['student_email'] = user_response.user.email
            except:
                session['student_name'] = 'Student'
                session['student_email'] = ''
        
        return {
            "success": True,
            "sessions": sessions
        }
        
    except Exception as e:
        logger.error(f"Error fetching mentor sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# CHAT ROUTES
# =====================================================

class ChatMessage(BaseModel):
    session_id: str
    sender_id: str
    message_text: str

@api_router.post("/chat/send")
async def send_chat_message(message: ChatMessage):
    """Send a chat message"""
    try:
        message_data = {
            'session_id': message.session_id,
            'sender_id': message.sender_id,
            'message_text': message.message_text,
            'is_read': False
        }
        
        response = supabase.table('mentor_chats').insert(message_data).execute()
        
        return {
            "success": True,
            "message": response.data[0]
        }
        
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/{session_id}/messages")
async def get_chat_messages(session_id: str):
    """Get all messages for a session"""
    try:
        response = supabase.table('mentor_chats').select('*').eq('session_id', session_id).order('created_at', asc=True).execute()
        
        return {
            "success": True,
            "messages": response.data
        }
        
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# WEEKLY CONTEST SETUP
# =====================================================

@api_router.post("/admin/contests/create-weekly")
async def create_weekly_contest(admin_email: str):
    """Create JEE Main 2025 weekly contest for upcoming Sunday (admin only)"""
    if admin_email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    
    try:
        from datetime import datetime, timedelta
        import uuid
        
        # Find next Sunday
        today = datetime.utcnow()
        days_until_sunday = (6 - today.weekday()) % 7
        if days_until_sunday == 0:
            days_until_sunday = 7
        
        next_sunday = today + timedelta(days=days_until_sunday)
        
        # Set times: 10 AM to 1 PM IST (4:30 AM to 7:30 AM UTC)
        start_time = next_sunday.replace(hour=4, minute=30, second=0, microsecond=0)
        end_time = start_time + timedelta(hours=3)
        result_time = end_time + timedelta(hours=1)
        
        contest_id = str(uuid.uuid4())
        
        # Create contest
        contest_data = {
            'contest_id': contest_id,
            'title': 'JEE Main 2025 - Weekly Mock Test',
            'description': 'Full-length JEE Main mock test with 75 questions. Test your preparation!',
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'result_time': result_time.isoformat(),
            'total_questions': 75,
            'duration_minutes': 180,
            'is_active': True
        }
        
        contest_response = supabase.table('contests').insert(contest_data).execute()
        
        logger.info(f"Weekly contest created by {admin_email} for {next_sunday.date()}")
        
        return {
            "success": True,
            "message": f"Weekly contest scheduled for {next_sunday.strftime('%A, %B %d, %Y')}",
            "contest": contest_response.data[0] if contest_response.data else None,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating weekly contest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# FILE UPLOAD ROUTES
# =====================================================

@api_router.post("/upload/verification-doc")
async def upload_verification_doc(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    doc_type: str = Form(...)  # 'college_id' or 'exam_result'
):
    """Upload verification documents to Supabase Storage"""
    try:
        # Read file content
        content = await file.read()
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1]
        filename = f"{user_id}/{doc_type}_{datetime.utcnow().timestamp()}.{file_extension}"
        
        # Upload to Supabase Storage
        response = supabase.storage.from_('mentor-verification-docs').upload(
            filename,
            content,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_('mentor-verification-docs').get_public_url(filename)
        
        return {
            "success": True,
            "url": public_url,
            "filename": filename
        }
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")



# =====================================================
# FREE ACCESS & SESSION MANAGEMENT
# =====================================================

# Special users with free access
FREE_ACCESS_EMAILS = ["rituchaubey1984@gmail.com"]

@api_router.get("/user/access-status")
async def check_user_access(email: str):
    """Check if user has mentor access (paid or free)"""
    try:
        # Check if user has free access
        if email in FREE_ACCESS_EMAILS:
            return {
                "has_access": True,
                "access_type": "free",
                "can_access_all_mentors": True
            }
        
        # Check if user has any paid sessions
        response = supabase.table('mentor_session_purchases').select('id').eq('student_email', email).eq('is_active', True).limit(1).execute()
        
        has_paid_access = len(response.data) > 0 if response.data else False
        
        return {
            "has_access": has_paid_access,
            "access_type": "paid" if has_paid_access else "none",
            "can_access_all_mentors": False
        }
    except Exception as e:
        logger.error(f"Error checking access: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/student/my-mentors")
async def get_student_mentors(student_email: str):
    """Get all mentors a student has access to"""
    try:
        # Check if free access user
        if student_email in FREE_ACCESS_EMAILS:
            # Return ALL approved mentors
            response = supabase.table('mentor_applications').select('*').eq('status', 'approved').execute()
            return {
                "success": True,
                "access_type": "free",
                "mentors": response.data or []
            }
        
        # Get mentors the student has paid for
        purchases = supabase.table('mentor_session_purchases').select('''
            *,
            mentor_applications!inner(*)
        ''').eq('student_email', student_email).eq('is_active', True).execute()
        
        return {
            "success": True,
            "access_type": "paid",
            "mentors": [p.get('mentor_applications') for p in (purchases.data or []) if p.get('mentor_applications')]
        }
    except Exception as e:
        logger.error(f"Error fetching student mentors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/mentor/my-students")
async def get_mentor_students(mentor_email: str):
    """Get all students who have purchased sessions with this mentor"""
    try:
        # Check if this is the special mentor (tomacwin9961@gmail.com)
        if mentor_email == "tomacwin9961@gmail.com":
            # Can see all students but only chat with rituchaubey1984@gmail.com
            # Return only the special student
            response = supabase.table('mentor_session_purchases').select('*').eq('student_email', 'rituchaubey1984@gmail.com').execute()
            
            students = []
            if response.data:
                for purchase in response.data:
                    # Get student details
                    user_response = await get_user_by_email(purchase['student_email'])
                    if user_response:
                        students.append({
                            "student_id": purchase['student_id'],
                            "student_email": purchase['student_email'],
                            "student_name": user_response.get('name', purchase['student_email'].split('@')[0]),
                            "purchased_at": purchase['created_at'],
                            "expires_at": purchase['expires_at'],
                            "is_active": purchase['is_active'],
                            "purchase_id": purchase['id']
                        })
            
            return {
                "success": True,
                "students": students,
                "is_special_mentor": True
            }
        
        # Regular mentor - get their students
        purchases = supabase.table('mentor_session_purchases').select('*').eq('mentor_email', mentor_email).eq('is_active', True).order('created_at', desc=True).execute()
        
        students = []
        for purchase in (purchases.data or []):
            # Get student user details
            user_response = await get_user_by_email(purchase['student_email'])
            students.append({
                "student_id": purchase['student_id'],
                "student_email": purchase['student_email'],
                "student_name": user_response.get('name', purchase['student_email'].split('@')[0]) if user_response else purchase['student_email'].split('@')[0],
                "purchased_at": purchase['created_at'],
                "expires_at": purchase['expires_at'],
                "is_active": purchase['is_active'],
                "purchase_id": purchase['id']
            })
        
        return {
            "success": True,
            "students": students,
            "is_special_mentor": False
        }
    except Exception as e:
        logger.error(f"Error fetching mentor students: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_user_by_email(email: str):
    """Helper function to get user details"""
    try:
        # Try to get from Supabase auth
        response = supabase.auth.admin.list_users()
        for user in response:
            if hasattr(user, 'email') and user.email == email:
                return {
                    "id": user.id,
                    "email": user.email,
                    "name": user.email.split('@')[0].capitalize()
                }
        return None
    except:
        return None

@api_router.post("/session/create-purchase")
async def create_session_purchase(
    student_id: str,
    student_email: str,
    mentor_user_id: str,
    mentor_email: str,
    amount_paid: float = 99,
    payment_id: str = None
):
    """Create a session purchase record after successful payment"""
    try:
        purchase_data = {
            "student_id": student_id,
            "student_email": student_email,
            "mentor_id": mentor_user_id,
            "mentor_email": mentor_email,
            "mentor_user_id": mentor_user_id,
            "amount_paid": amount_paid,
            "payment_id": payment_id,
            "payment_status": "completed",
            "session_status": "active",
            "is_active": True
        }
        
        response = supabase.table('mentor_session_purchases').insert(purchase_data).execute()
        
        return {
            "success": True,
            "purchase": response.data[0] if response.data else None
        }
    except Exception as e:
        logger.error(f"Error creating purchase: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/mentors/approved")
async def get_approved_mentors():
    """Get all approved mentors from mentor_applications"""
    try:
        response = supabase.table('mentor_applications').select('*').eq('status', 'approved').order('created_at', desc=True).execute()
        
        return {
            "success": True,
            "mentors": response.data or []
        }
    except Exception as e:
        logger.error(f"Error fetching approved mentors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# MOCK TEST AUTO-GENERATION ROUTES
# =====================================================

@api_router.get("/mock-tests/available")
async def get_available_mock_tests():
    """Get all available mock tests (shifts with 75+ questions)"""
    try:
        # Fetch all questions
        response = supabase.table('questions').select('id, exam_shift, subject, exam_year').execute()
        
        if not response.data:
            return {"success": True, "mock_tests": []}
        
        # Group questions by shift
        shifts = {}
        for q in response.data:
            shift = q.get('exam_shift', '').strip()
            if not shift:
                continue
            
            if shift not in shifts:
                shifts[shift] = {
                    'shift': shift,
                    'exam_year': q.get('exam_year', 2025),
                    'total': 0,
                    'Physics': [],
                    'Chemistry': [],
                    'Mathematics': []
                }
            
            shifts[shift]['total'] += 1
            subject = q.get('subject', '').strip()
            if subject in ['Physics', 'Chemistry', 'Mathematics']:
                shifts[shift][subject].append(q['id'])
        
        # Filter shifts with exactly 75 questions (valid mock tests)
        mock_tests = []
        for shift, data in shifts.items():
            if data['total'] == 75:
                mock_tests.append({
                    'id': shift.replace(' ', '_').lower(),
                    'title': f"JEE Main {shift}",
                    'exam_shift': shift,
                    'exam_year': data['exam_year'],
                    'date': shift,  # Parse date from shift name
                    'duration': "3 Hours",
                    'questions': 75,
                    'pattern': "25 Questions per subject (Physics, Chemistry, Mathematics)",
                    'status': 'Available',
                    'physics_count': len(data['Physics']),
                    'chemistry_count': len(data['Chemistry']),
                    'maths_count': len(data['Mathematics'])
                })
        
        # Sort by date (newest first)
        mock_tests.sort(key=lambda x: x['exam_year'], reverse=True)
        
        logger.info(f"Found {len(mock_tests)} available mock tests")
        
        return {
            "success": True,
            "mock_tests": mock_tests,
            "total_count": len(mock_tests)
        }
        
    except Exception as e:
        logger.error(f"Error fetching mock tests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/mock-tests/{test_id}/questions")
async def get_mock_test_questions(test_id: str):
    """Get all question IDs for a specific mock test"""
    try:
        # Convert test_id back to exam_shift format
        # Example: "21_jan_shift_1" -> "21 Jan Shift 1"
        exam_shift = test_id.replace('_', ' ').title()
        
        # Variations to handle different naming formats
        shift_variations = [
            exam_shift,
            exam_shift.replace('Shift', 'shift'),
            test_id.replace('_', ' ')
        ]
        
        # Fetch all questions for this shift
        all_questions = []
        for variation in shift_variations:
            response = supabase.table('questions').select('id, subject, exam_shift').eq('exam_shift', variation).execute()
            if response.data and len(response.data) > 0:
                all_questions = response.data
                exam_shift = variation  # Use the matching variation
                break
        
        if not all_questions:
            raise HTTPException(status_code=404, detail=f"No questions found for test: {test_id}")
        
        # Group by subject
        question_ids = {
            'Physics': [],
            'Chemistry': [],
            'Mathematics': []
        }
        
        for q in all_questions:
            subject = q.get('subject', '').strip()
            if subject in question_ids:
                question_ids[subject].append(q['id'])
        
        # Verify we have all questions
        total = len(question_ids['Physics']) + len(question_ids['Chemistry']) + len(question_ids['Mathematics'])
        
        if total < 75:
            # Not enough questions - try to fill with random questions
            logger.warning(f"Only {total} questions found for {exam_shift}. Need 75 total.")
            
            # Calculate how many random questions needed per subject
            shortage = 75 - total
            per_subject = shortage // 3
            
            # Fetch random questions from database (excluding current test questions)
            existing_ids = question_ids['Physics'] + question_ids['Chemistry'] + question_ids['Mathematics']
            
            for subject in ['Physics', 'Chemistry', 'Mathematics']:
                if len(question_ids[subject]) < 25:
                    needed = 25 - len(question_ids[subject])
                    random_q = supabase.table('questions').select('id').eq('subject', subject).not_.in_('id', existing_ids).limit(needed).execute()
                    if random_q.data:
                        question_ids[subject].extend([q['id'] for q in random_q.data])
        
        return {
            "success": True,
            "test_id": test_id,
            "exam_shift": exam_shift,
            "question_ids": question_ids,
            "total_questions": len(question_ids['Physics']) + len(question_ids['Chemistry']) + len(question_ids['Mathematics']),
            "physics_count": len(question_ids['Physics']),
            "chemistry_count": len(question_ids['Chemistry']),
            "maths_count": len(question_ids['Mathematics'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching test questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
