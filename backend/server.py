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
ADMIN_EMAILS = ["tomacwin9961@gmail.com", "prepixo.official@gmail.com"]

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
    """Get all mentor applications (admin only)"""
    if admin_email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    
    try:
        response = supabase.table('mentor_applications').select('*').order('created_at', desc=True).execute()
        return {"success": True, "applications": response.data}
    except Exception as e:
        logger.error(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching applications: {str(e)}")

@api_router.post("/admin/applications/{application_id}/approve")
async def approve_application(application_id: str, request: ApproveRejectRequest):
    """Approve a mentor application and create mentor profile"""
    if request.admin_email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    
    try:
        # Get the application
        app_response = supabase.table('mentor_applications').select('*').eq('id', application_id).execute()
        
        if not app_response.data:
            raise HTTPException(status_code=404, detail="Application not found")
        
        application = app_response.data[0]
        
        # Update application status
        update_response = supabase.table('mentor_applications').update({
            'status': 'approved',
            'admin_notes': request.admin_notes,
            'reviewed_at': datetime.utcnow().isoformat(),
            'reviewed_by': request.admin_email,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', application_id).execute()
        
        # Create mentor profile
        mentor_profile = {
            'user_id': application['user_id'],
            'application_id': application_id,
            'full_name': application['full_name'],
            'tagline': application['tagline'],
            'achievements': application['achievements'],
            'about_me': application['about_me'],
            'college_name': application['college_name'] if application['display_college_publicly'] else None,
            'course': application['course'] if application['display_college_publicly'] else None,
            'display_college': application['display_college_publicly'],
            'exam_expertise': application['exam_expertise'],
            'is_active': True,
            'is_verified': True,
            'total_sessions': 0,
            'rating': 0.00,
            'total_reviews': 0
        }
        
        profile_response = supabase.table('mentor_profiles').insert(mentor_profile).execute()
        
        logger.info(f"Application {application_id} approved by {request.admin_email}")
        
        return {
            "success": True,
            "message": "Application approved and mentor profile created",
            "application": update_response.data,
            "profile": profile_response.data
        }
        
    except Exception as e:
        logger.error(f"Error approving application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error approving application: {str(e)}")

@api_router.post("/admin/applications/{application_id}/reject")
async def reject_application(application_id: str, request: ApproveRejectRequest):
    """Reject a mentor application"""
    if request.admin_email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    
    try:
        # Update application status
        response = supabase.table('mentor_applications').update({
            'status': 'rejected',
            'admin_notes': request.admin_notes,
            'reviewed_at': datetime.utcnow().isoformat(),
            'reviewed_by': request.admin_email,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', application_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Application not found")
        
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
        
        return {
            "success": True,
            "mentor": response.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching mentor: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching mentor: {str(e)}")


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
