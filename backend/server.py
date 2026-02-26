from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import asyncio
import resend


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Touchpoints(BaseModel):
    whatsapp: bool = False
    email: bool = False
    crisp: bool = False
    notes: str = ""

class OrderStage(BaseModel):
    in_embroidery: bool = False
    customizing: bool = False
    washing: bool = False
    ready_to_dispatch: bool = False
    sent_to_delhi: bool = False
    left_xportel: bool = False
    reached_country: bool = False
    delivered: bool = False

class ProductItem(BaseModel):
    name: str
    quantity: int
    sku: str

class CustomReminder(BaseModel):
    days: int = 0
    time: str = ""
    note: str = ""
    is_active: bool = False

class OrderCreate(BaseModel):
    order_number: str
    order_date: str
    customer_name: str
    customer_email: EmailStr
    product_items: List[ProductItem]
    amount: float
    notes: Optional[str] = ""

class OrderUpdate(BaseModel):
    touchpoints: Optional[Touchpoints] = None
    stages: Optional[OrderStage] = None
    notes: Optional[str] = None
    custom_reminder: Optional[CustomReminder] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = ""
    order_date: str
    customer_name: str
    customer_email: str
    product_items: List[ProductItem] = Field(default_factory=list)
    amount: float
    notes: str = ""
    touchpoints: Touchpoints = Field(default_factory=Touchpoints)
    stages: OrderStage = Field(default_factory=OrderStage)
    custom_reminder: CustomReminder = Field(default_factory=CustomReminder)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_high_priority: bool = False

class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

class ReminderResponse(BaseModel):
    order_id: str
    customer_name: str
    days_since_update: int
    amount: float


# Routes
@api_router.get("/")
async def root():
    return {"message": "Kashmkari Support Platform API"}

@api_router.post("/orders", response_model=Order)
async def create_order(input: OrderCreate):
    order_dict = input.model_dump()
    order_obj = Order(**order_dict)
    
    # Calculate high priority
    touchpoint_count = sum([order_obj.touchpoints.whatsapp, order_obj.touchpoints.email, order_obj.touchpoints.crisp])
    order_obj.is_high_priority = order_obj.amount > 500 or touchpoint_count > 3
    
    # Convert to dict and serialize datetime
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['last_updated'] = doc['last_updated'].isoformat()
    
    await db.orders.insert_one(doc)
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(filter: Optional[str] = None):
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects and handle legacy data
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['last_updated'], str):
            order['last_updated'] = datetime.fromisoformat(order['last_updated'])
        
        # Handle legacy orders without order_number
        if 'order_number' not in order or not order['order_number']:
            order['order_number'] = f"ORD-{order['id'][:8]}"
        
        # Handle legacy orders with string product_items instead of list
        if 'product_items' in order and isinstance(order['product_items'], str):
            # Convert old string format to new list format
            order['product_items'] = [{
                "name": order['product_items'],
                "quantity": order.get('quantity', 1),
                "sku": order.get('sku', '')
            }]
        
        # Ensure product_items exists
        if 'product_items' not in order:
            order['product_items'] = []
        
        # Ensure custom_reminder exists
        if 'custom_reminder' not in order:
            order['custom_reminder'] = {"days": 0, "time": "", "note": "", "is_active": False}
        
        # Ensure touchpoints.notes exists
        if 'touchpoints' in order and 'notes' not in order['touchpoints']:
            order['touchpoints']['notes'] = ""
    
    # Sort by created_at descending (newest first)
    orders.sort(key=lambda x: x['created_at'], reverse=True)
    
    # Apply filters
    if filter == "pending":
        # Exclude orders that are sent to Delhi or beyond (dispatched)
        orders = [o for o in orders if not (o['stages']['sent_to_delhi'] or o['stages']['left_xportel'] or o['stages']['reached_country'] or o['stages']['delivered'])]
    elif filter == "high_priority":
        orders = [o for o in orders if o['is_high_priority']]
    
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order['last_updated'], str):
        order['last_updated'] = datetime.fromisoformat(order['last_updated'])
    
    # Handle legacy orders without order_number
    if 'order_number' not in order or not order['order_number']:
        order['order_number'] = f"ORD-{order['id'][:8]}"
    
    # Handle legacy orders with string product_items instead of list
    if 'product_items' in order and isinstance(order['product_items'], str):
        order['product_items'] = [{
            "name": order['product_items'],
            "quantity": order.get('quantity', 1),
            "sku": order.get('sku', '')
        }]
    
    # Ensure product_items exists
    if 'product_items' not in order:
        order['product_items'] = []
    
    # Ensure custom_reminder exists
    if 'custom_reminder' not in order:
        order['custom_reminder'] = {"days": 0, "time": "", "note": "", "is_active": False}
    
    # Ensure touchpoints.notes exists
    if 'touchpoints' in order and 'notes' not in order['touchpoints']:
        order['touchpoints']['notes'] = ""
    
    return order

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, update: OrderUpdate):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Prepare update data
    update_data = {}
    if update.touchpoints:
        update_data['touchpoints'] = update.touchpoints.model_dump()
    if update.stages:
        update_data['stages'] = update.stages.model_dump()
    if update.notes is not None:
        update_data['notes'] = update.notes
    if update.custom_reminder:
        update_data['custom_reminder'] = update.custom_reminder.model_dump()
    
    update_data['last_updated'] = datetime.now(timezone.utc).isoformat()
    
    # Recalculate high priority if touchpoints changed
    if update.touchpoints:
        touchpoint_count = sum([update.touchpoints.whatsapp, update.touchpoints.email, update.touchpoints.crisp])
        update_data['is_high_priority'] = order['amount'] > 500 or touchpoint_count > 3
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    # Fetch updated order
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(updated_order['created_at'], str):
        updated_order['created_at'] = datetime.fromisoformat(updated_order['created_at'])
    if isinstance(updated_order['last_updated'], str):
        updated_order['last_updated'] = datetime.fromisoformat(updated_order['last_updated'])
    
    return updated_order

@api_router.get("/reminders", response_model=List[ReminderResponse])
async def get_reminders():
    # Get orders that haven't been updated in 5 days
    five_days_ago = datetime.now(timezone.utc) - timedelta(days=5)
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    
    reminders = []
    for order in orders:
        last_updated = datetime.fromisoformat(order['last_updated'])
        if last_updated < five_days_ago:
            days_since_update = (datetime.now(timezone.utc) - last_updated).days
            reminders.append({
                "order_id": order['id'],
                "customer_name": order['customer_name'],
                "days_since_update": days_since_update,
                "amount": order['amount']
            })
    
    return reminders

@api_router.post("/send-email")
async def send_email(request: EmailRequest):
    if not resend.api_key:
        raise HTTPException(status_code=500, detail="Resend API key not configured")
    
    params = {
        "from": SENDER_EMAIL,
        "to": [request.recipient_email],
        "subject": request.subject,
        "html": request.html_content
    }

    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {
            "status": "success",
            "message": f"Email sent to {request.recipient_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = await db.orders.delete_one({"id": order_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order deleted successfully", "order_id": order_id}

@api_router.post("/orders/bulk-delete")
async def bulk_delete_orders(order_ids: List[str]):
    result = await db.orders.delete_many({"id": {"$in": order_ids}})
    
    return {
        "message": f"{result.deleted_count} orders deleted successfully",
        "deleted_count": result.deleted_count
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()