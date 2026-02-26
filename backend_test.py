import requests
import sys
from datetime import datetime, timedelta
import uuid
import time

class KashmkariAPITester:
    def __init__(self, base_url="https://dispatch-hub-186.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_orders = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")

            return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_health(self):
        """Test API health endpoint"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "/",
            200
        )
        return success

    def test_create_order_basic(self):
        """Test creating a basic order"""
        order_data = {
            "order_date": "2024-01-15",
            "customer_name": "John Doe Test",
            "customer_email": "john.test@example.com",
            "product_items": "Hand Embroidered Shawl",
            "quantity": 1,
            "sku": "SHWL-001",
            "amount": 299.99,
            "notes": "Test order creation"
        }
        
        success, response = self.run_test(
            "Create Basic Order",
            "POST",
            "/orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            self.created_orders.append(response['id'])
            # Verify order has correct default values
            if response.get('is_high_priority') == False:  # Should be false for < $500
                print(f"   ✅ High priority correctly set to False for ${order_data['amount']}")
            else:
                print(f"   ❌ High priority should be False for ${order_data['amount']}")
            
            return response['id']
        return None

    def test_create_high_priority_order(self):
        """Test creating a high priority order (>$500)"""
        order_data = {
            "order_date": "2024-01-15",
            "customer_name": "Jane Smith VIP",
            "customer_email": "jane.vip@example.com", 
            "product_items": "Premium Kashmiri Carpet",
            "quantity": 1,
            "sku": "CRPT-001",
            "amount": 750.00,
            "notes": "High value order test"
        }
        
        success, response = self.run_test(
            "Create High Priority Order",
            "POST",
            "/orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            self.created_orders.append(response['id'])
            # Verify high priority is set correctly
            if response.get('is_high_priority') == True:  # Should be true for > $500
                print(f"   ✅ High priority correctly set to True for ${order_data['amount']}")
            else:
                print(f"   ❌ High priority should be True for ${order_data['amount']}")
                
            return response['id']
        return None

    def test_get_orders(self):
        """Test getting all orders"""
        success, response = self.run_test(
            "Get All Orders",
            "GET", 
            "/orders",
            200
        )
        
        if success:
            orders_count = len(response) if isinstance(response, list) else 0
            print(f"   📊 Found {orders_count} orders")
            return response
        return []

    def test_get_single_order(self, order_id):
        """Test getting a single order by ID"""
        success, response = self.run_test(
            f"Get Order by ID",
            "GET",
            f"/orders/{order_id}",
            200
        )
        return success, response

    def test_update_touchpoints(self, order_id):
        """Test updating customer touchpoints"""
        touchpoint_data = {
            "touchpoints": {
                "whatsapp": True,
                "email": True,
                "crisp": False
            }
        }
        
        success, response = self.run_test(
            "Update Touchpoints",
            "PUT",
            f"/orders/{order_id}",
            200,
            data=touchpoint_data
        )
        
        if success:
            # Check if touchpoints were updated correctly
            touchpoints = response.get('touchpoints', {})
            if touchpoints.get('whatsapp') and touchpoints.get('email') and not touchpoints.get('crisp'):
                print(f"   ✅ Touchpoints updated correctly")
            else:
                print(f"   ❌ Touchpoints not updated correctly")
        
        return success

    def test_update_order_stages(self, order_id):
        """Test updating order stages"""
        stages_data = {
            "stages": {
                "in_embroidery": True,
                "customizing": True,
                "washing": False,
                "ready_to_dispatch": False,
                "sent_to_delhi": False,
                "left_xportel": False,
                "reached_country": False,
                "delivered": False
            }
        }
        
        success, response = self.run_test(
            "Update Order Stages",
            "PUT",
            f"/orders/{order_id}",
            200,
            data=stages_data
        )
        
        if success:
            # Check if stages were updated correctly
            stages = response.get('stages', {})
            if stages.get('in_embroidery') and stages.get('customizing'):
                print(f"   ✅ Order stages updated correctly")
            else:
                print(f"   ❌ Order stages not updated correctly")
        
        return success

    def test_reminders_system(self):
        """Test the reminder system for old orders"""
        success, response = self.run_test(
            "Get Reminders",
            "GET",
            "/reminders",
            200
        )
        
        if success:
            reminders_count = len(response) if isinstance(response, list) else 0
            print(f"   📋 Found {reminders_count} orders needing reminders")
            
            # Check reminder structure if any exist
            if reminders_count > 0:
                reminder = response[0]
                required_fields = ['order_id', 'customer_name', 'days_since_update', 'amount']
                missing_fields = [field for field in required_fields if field not in reminder]
                if not missing_fields:
                    print(f"   ✅ Reminder structure is correct")
                else:
                    print(f"   ❌ Missing fields in reminder: {missing_fields}")
        
        return success

    def test_order_not_found(self):
        """Test getting non-existent order"""
        fake_id = str(uuid.uuid4())
        success, response = self.run_test(
            "Get Non-existent Order",
            "GET",
            f"/orders/{fake_id}",
            404
        )
        return success

    def test_invalid_order_creation(self):
        """Test creating order with invalid data"""
        invalid_data = {
            "order_date": "2024-01-15",
            "customer_name": "",  # Empty name
            "customer_email": "invalid-email",  # Invalid email
            "product_items": "Test Product",
            "quantity": 0,  # Invalid quantity
            "sku": "TEST-001",
            "amount": -100  # Negative amount
        }
        
        success, response = self.run_test(
            "Create Invalid Order",
            "POST",
            "/orders",
            422  # Validation error
        )
        return success

def main():
    print("🚀 Starting Kashmkari Customer Support Platform API Tests")
    print("=" * 60)
    
    tester = KashmkariAPITester()
    
    # Test 1: API Health
    if not tester.test_api_health():
        print("❌ API is not responding. Stopping tests.")
        return 1
    
    # Test 2: Create basic order
    basic_order_id = tester.test_create_order_basic()
    if not basic_order_id:
        print("❌ Failed to create basic order. Critical failure.")
        return 1
    
    # Test 3: Create high priority order  
    high_priority_order_id = tester.test_create_high_priority_order()
    
    # Test 4: Get all orders
    all_orders = tester.test_get_orders()
    
    # Test 5: Get single order
    if basic_order_id:
        tester.test_get_single_order(basic_order_id)
    
    # Test 6: Update touchpoints
    if basic_order_id:
        tester.test_update_touchpoints(basic_order_id)
    
    # Test 7: Update order stages
    if basic_order_id:
        tester.test_update_order_stages(basic_order_id)
    
    # Test 8: Test reminders system
    tester.test_reminders_system()
    
    # Test 9: Test error handling
    tester.test_order_not_found()
    tester.test_invalid_order_creation()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! API is working correctly.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())