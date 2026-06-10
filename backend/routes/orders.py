from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import razorpay
import os
from datetime import datetime
import hmac
import hashlib

router = APIRouter()

# Initialize Razorpay client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_live_SObcQvFXRo6HAa")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Request/Response Models
class CreateOrderRequest(BaseModel):
    amount: int  # Amount in smallest currency unit (paise)
    currency: str = "INR"
    receipt: str
    notes: dict = {}

class CreateOrderResponse(BaseModel):
    id: str
    entity: str
    amount: int
    amount_paid: int
    amount_due: int
    currency: str
    receipt: str
    status: str
    attempts: int
    notes: dict
    created_at: int

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str


@router.post("/create", response_model=CreateOrderResponse)
async def create_order(request: CreateOrderRequest):
    """
    Create a Razorpay order
    
    As per Razorpay documentation:
    - Order is mandatory for every payment
    - Order ID secures the payment request
    - Payments without order_id cannot be captured
    """
    try:
        # Create order data
        order_data = {
            "amount": request.amount,  # Amount in paise
            "currency": request.currency,
            "receipt": request.receipt,
            "notes": request.notes
        }
        
        # Create order using Razorpay API
        order = client.order.create(data=order_data)
        
        return CreateOrderResponse(**order)
    
    except razorpay.errors.BadRequestError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(request: VerifyPaymentRequest):
    """
    Verify payment signature
    
    As per Razorpay documentation:
    - This is MANDATORY to confirm payment authenticity
    - Generate signature using order_id + payment_id + key_secret
    - Use SHA256 HMAC algorithm
    - Match with razorpay_signature received from frontend
    """
    try:
        # Construct the signature string as per Razorpay docs
        message = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
        
        # Generate signature using HMAC SHA256
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Verify signature
        if generated_signature == request.razorpay_signature:
            return VerifyPaymentResponse(
                success=True,
                message="Payment verified successfully"
            )
        else:
            return VerifyPaymentResponse(
                success=False,
                message="Payment verification failed: Invalid signature"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )


@router.get("/payment/{payment_id}")
async def get_payment_details(payment_id: str):
    """
    Fetch payment details from Razorpay
    
    As per Razorpay documentation:
    - Use this to check payment status
    - Can be used as alternative to webhooks
    """
    try:
        payment = client.payment.fetch(payment_id)
        return payment
    except razorpay.errors.BadRequestError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment: {str(e)}")
