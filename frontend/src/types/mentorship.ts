// Mentorship Platform Types
// These extend the main Supabase types

export type MentorApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type SessionStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';
export type ExamExpertise = 'JEE' | 'NEET' | 'CUET' | 'NDA' | 'Boards';

export interface MentorApplication {
  id: string;
  user_id: string;
  full_name: string;
  mobile_number: string;
  email: string;
  exam_expertise: ExamExpertise[];
  college_name: string;
  course: string;
  display_college_publicly: boolean;
  tagline: string;
  achievements: string;
  about_me: string;
  college_id_url: string;
  exam_result_url: string;
  status: MentorApplicationStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface MentorProfile {
  id: string;
  user_id: string;
  application_id?: string;
  full_name: string;
  profile_photo_url?: string;
  tagline: string;
  achievements: string;
  about_me: string;
  college_name?: string;
  course?: string;
  display_college: boolean;
  exam_expertise: ExamExpertise[];
  expertise_tags?: string[];
  media_urls?: string[];
  is_active: boolean;
  is_verified: boolean;
  total_sessions: number;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface MentorService {
  id: string;
  mentor_id: string;
  title: string;
  description: string;
  price: number;
  duration_minutes?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MentorSession {
  id: string;
  student_id: string;
  mentor_id: string;
  service_id: string;
  payment_amount: number;
  payment_id?: string;
  payment_status: PaymentStatus;
  session_status: SessionStatus;
  meeting_link?: string;
  scheduled_at?: string;
  completed_at?: string;
  student_rating?: number;
  student_review?: string;
  created_at: string;
  updated_at: string;
}

export interface MentorChat {
  id: string;
  session_id: string;
  sender_id: string;
  message_text?: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file';
  is_read: boolean;
  created_at: string;
}

export interface AdminApplicationChat {
  id: string;
  application_id: string;
  sender_id: string;
  sender_role: 'admin' | 'applicant';
  message_text: string;
  created_at: string;
}

// Extended types with relations
export interface MentorProfileWithServices extends MentorProfile {
  services: MentorService[];
}

export interface MentorSessionWithDetails extends MentorSession {
  mentor: MentorProfile;
  service: MentorService;
  student: {
    id: string;
    email: string;
  };
}

export interface MentorChatWithSender extends MentorChat {
  sender: {
    id: string;
    email: string;
    full_name?: string;
  };
}
