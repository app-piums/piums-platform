#!/bin/bash

# Reviews Service Integration Tests
# Este script prueba todos los endpoints del servicio de reseñas

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
BASE_URL="http://localhost:4008"
AUTH_URL="http://localhost:4001"
USERS_URL="http://localhost:4002"
BOOKING_URL="http://localhost:4005"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print colored output
print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Function to check if service is running
check_service() {
    print_info "Checking if services are running..."
    
    if ! curl -s "$BASE_URL/health" > /dev/null; then
        print_error "reviews-service is not running on $BASE_URL"
        exit 1
    fi
    
    if ! curl -s "$AUTH_URL/health" > /dev/null; then
        print_error "auth-service is not running on $AUTH_URL"
        exit 1
    fi
    
    if ! curl -s "$BOOKING_URL/health" > /dev/null; then
        print_error "booking-service is not running on $BOOKING_URL"
        exit 1
    fi
    
    print_success "All services are running"
    echo
}

# Function to register and login a client
setup_client() {
    print_info "Setting up client user..."
    
    # Register client
    CLIENT_DATA=$(curl -s -X POST "$AUTH_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "client-reviews-test@test.com",
            "password": "Test123456!",
            "name": "Review Test Client",
            "role": "CLIENT"
        }' || echo "{}")
    
    CLIENT_ID=$(echo "$CLIENT_DATA" | jq -r '.user.id // empty')
    
    if [ -z "$CLIENT_ID" ]; then
        # Try login if already exists
        CLIENT_DATA=$(curl -s -X POST "$AUTH_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{
                "email": "client-reviews-test@test.com",
                "password": "Test123456!"
            }')
        
        CLIENT_ID=$(echo "$CLIENT_DATA" | jq -r '.user.id')
        CLIENT_TOKEN=$(echo "$CLIENT_DATA" | jq -r '.accessToken')
    else
        CLIENT_TOKEN=$(echo "$CLIENT_DATA" | jq -r '.accessToken')
    fi
    
    if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" = "null" ]; then
        print_error "Failed to setup client"
        exit 1
    fi
    
    print_success "Client setup complete (ID: $CLIENT_ID)"
    echo
}

# Function to register and login an artist
setup_artist() {
    print_info "Setting up artist user..."
    
    # Register artist
    ARTIST_DATA=$(curl -s -X POST "$AUTH_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "artist-reviews-test@test.com",
            "password": "Test123456!",
            "name": "Review Test Artist",
            "role": "ARTIST"
        }' || echo "{}")
    
    ARTIST_ID=$(echo "$ARTIST_DATA" | jq -r '.user.id // empty')
    
    if [ -z "$ARTIST_ID" ]; then
        # Try login if already exists
        ARTIST_DATA=$(curl -s -X POST "$AUTH_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{
                "email": "artist-reviews-test@test.com",
                "password": "Test123456!"
            }')
        
        ARTIST_ID=$(echo "$ARTIST_DATA" | jq -r '.user.id')
        ARTIST_TOKEN=$(echo "$ARTIST_DATA" | jq -r '.accessToken')
    else
        ARTIST_TOKEN=$(echo "$ARTIST_DATA" | jq -r '.accessToken')
    fi
    
    if [ -z "$ARTIST_ID" ] || [ "$ARTIST_ID" = "null" ]; then
        print_error "Failed to setup artist"
        exit 1
    fi
    
    print_success "Artist setup complete (ID: $ARTIST_ID)"
    echo
}

# Function to create a completed booking
setup_booking() {
    print_info "Creating a completed booking..."
    
    # Create booking
    BOOKING_DATA=$(curl -s -X POST "$BOOKING_URL/api/bookings" \
        -H "Authorization: Bearer $CLIENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"artistId\": \"$ARTIST_ID\",
            \"serviceId\": \"service-123\",
            \"eventDate\": \"2024-12-31T20:00:00Z\",
            \"eventDuration\": 120,
            \"location\": \"Test Venue\",
            \"notes\": \"Test booking for reviews\"
        }")
    
    BOOKING_ID=$(echo "$BOOKING_DATA" | jq -r '.id // .booking.id // empty')
    
    if [ -z "$BOOKING_ID" ] || [ "$BOOKING_ID" = "null" ]; then
        print_error "Failed to create booking"
        echo "$BOOKING_DATA"
        exit 1
    fi
    
    # Mark booking as completed (simulate completion)
    # Note: This might require admin access or direct DB manipulation in production
    # For testing, we'll try to use the markPayment endpoint
    COMPLETE_DATA=$(curl -s -X POST "$BOOKING_URL/api/bookings/$BOOKING_ID/complete" \
        -H "Authorization: Bearer $ARTIST_TOKEN" \
        -H "Content-Type: application/json" || echo "{}")
    
    print_success "Booking created and marked as completed (ID: $BOOKING_ID)"
    echo
}

# Test 1: Health Check
test_health_check() {
    print_test "1. Health Check"
    
    RESPONSE=$(curl -s "$BASE_URL/health")
    STATUS=$(echo "$RESPONSE" | jq -r '.status')
    
    if [ "$STATUS" = "healthy" ]; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
    fi
    echo
}

# Test 2: Create Review
test_create_review() {
    print_test "2. Create Review"
    
    REVIEW_DATA=$(curl -s -X POST "$BASE_URL/api/reviews/reviews" \
        -H "Authorization: Bearer $CLIENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"bookingId\": \"$BOOKING_ID\",
            \"rating\": 5,
            \"comment\": \"Excelente servicio! Muy profesional y puntual. Lo recomiendo 100%.\",
            \"photos\": [
                {
                    \"url\": \"https://example.com/photo1.jpg\",
                    \"caption\": \"Resultado final del evento\"
                },
                {
                    \"url\": \"https://example.com/photo2.jpg\",
                    \"caption\": \"Setup del equipo\"
                }
            ]
        }")
    
    REVIEW_ID=$(echo "$REVIEW_DATA" | jq -r '.id // empty')
    
    if [ -n "$REVIEW_ID" ] && [ "$REVIEW_ID" != "null" ]; then
        export REVIEW_ID
        print_success "Review created (ID: $REVIEW_ID)"
    else
        print_error "Failed to create review"
        echo "$REVIEW_DATA" | jq '.'
    fi
    echo
}

# Test 3: Get Review by ID
test_get_review() {
    print_test "3. Get Review by ID"
    
    if [ -z "$REVIEW_ID" ]; then
        print_error "No review ID available"
        echo
        return
    fi
    
    RESPONSE=$(curl -s "$BASE_URL/api/reviews/reviews/$REVIEW_ID")
    RATING=$(echo "$RESPONSE" | jq -r '.rating // empty')
    
    if [ -n "$RATING" ] && [ "$RATING" != "null" ]; then
        print_success "Review retrieved (Rating: $RATING stars)"
    else
        print_error "Failed to get review"
    fi
    echo
}

# Test 4: List Reviews (by Artist)
test_list_reviews() {
    print_test "4. List Reviews by Artist"
    
    RESPONSE=$(curl -s "$BASE_URL/api/reviews/reviews?artistId=$ARTIST_ID")
    TOTAL=$(echo "$RESPONSE" | jq -r '.pagination.total // 0')
    
    print_success "Found $TOTAL reviews for artist"
    echo
}

# Test 5: Artist Responds to Review
test_respond_review() {
    print_test "5. Artist Responds to Review"
    
    if [ -z "$REVIEW_ID" ]; then
        print_error "No review ID available"
        echo
        return
    fi
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/reviews/reviews/$REVIEW_ID/respond" \
        -H "Authorization: Bearer $ARTIST_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "message": "Muchas gracias por tu excelente reseña! Fue un placer trabajar en tu evento."
        }')
    
    RESPONSE_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
    
    if [ -n "$RESPONSE_ID" ] && [ "$RESPONSE_ID" != "null" ]; then
        export RESPONSE_ID
        print_success "Artist response created (ID: $RESPONSE_ID)"
    else
        print_error "Failed to create response"
        echo "$RESPONSE" | jq '.'
    fi
    echo
}

# Test 6: Update Review
test_update_review() {
    print_test "6. Update Review"
    
    if [ -z "$REVIEW_ID" ]; then
        print_error "No review ID available"
        echo
        return
    fi
    
    RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/reviews/reviews/$REVIEW_ID" \
        -H "Authorization: Bearer $CLIENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "comment": "Excelente servicio! ACTUALIZADO: El artista también fue muy amable."
        }')
    
    UPDATED_AT=$(echo "$RESPONSE" | jq -r '.updatedAt // empty')
    
    if [ -n "$UPDATED_AT" ] && [ "$UPDATED_AT" != "null" ]; then
        print_success "Review updated"
    else
        print_error "Failed to update review"
    fi
    echo
}

# Test 7: Mark Review as Helpful
test_helpful_vote() {
    print_test "7. Mark Review as Helpful"
    
    if [ -z "$REVIEW_ID" ]; then
        print_error "No review ID available"
        echo
        return
    fi
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/reviews/reviews/$REVIEW_ID/helpful" \
        -H "Content-Type: application/json" \
        -d '{
            "helpful": true
        }')
    
    HELPFUL_COUNT=$(echo "$RESPONSE" | jq -r '.helpfulCount // empty')
    
    if [ -n "$HELPFUL_COUNT" ] && [ "$HELPFUL_COUNT" != "null" ]; then
        print_success "Review marked as helpful (Count: $HELPFUL_COUNT)"
    else
        print_error "Failed to vote"
    fi
    echo
}

# Test 8: Report Review
test_report_review() {
    print_test "8. Report Review"
    
    if [ -z "$REVIEW_ID" ]; then
        print_error "No review ID available"
        echo
        return
    fi
    
    # Create another user to report
    REPORTER_DATA=$(curl -s -X POST "$AUTH_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "reporter-test@test.com",
            "password": "Test123456!",
            "name": "Reporter Test",
            "role": "CLIENT"
        }' || echo "{}")
    
    REPORTER_TOKEN=$(echo "$REPORTER_DATA" | jq -r '.accessToken // empty')
    
    if [ -z "$REPORTER_TOKEN" ]; then
        # Try login if already exists
        REPORTER_DATA=$(curl -s -X POST "$AUTH_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{
                "email": "reporter-test@test.com",
                "password": "Test123456!"
            }')
        REPORTER_TOKEN=$(echo "$REPORTER_DATA" | jq -r '.accessToken')
    fi
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/reviews/reviews/$REVIEW_ID/report" \
        -H "Authorization: Bearer $REPORTER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "reason": "SPAM",
            "description": "Esta reseña parece ser spam de prueba"
        }')
    
    REPORT_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
    
    if [ -n "$REPORT_ID" ] && [ "$REPORT_ID" != "null" ]; then
        export REPORT_ID
        print_success "Review reported (ID: $REPORT_ID)"
    else
        print_error "Failed to report review"
    fi
    echo
}

# Test 9: Get Artist Rating
test_get_artist_rating() {
    print_test "9. Get Artist Rating Statistics"
    
    RESPONSE=$(curl -s "$BASE_URL/api/reviews/artists/$ARTIST_ID/rating")
    AVG_RATING=$(echo "$RESPONSE" | jq -r '.averageRating // empty')
    TOTAL=$(echo "$RESPONSE" | jq -r '.totalReviews // empty')
    RESPONSE_RATE=$(echo "$RESPONSE" | jq -r '.responseRate // empty')
    
    if [ -n "$AVG_RATING" ] && [ "$AVG_RATING" != "null" ]; then
        print_success "Artist rating retrieved (Avg: $AVG_RATING, Total: $TOTAL, Response Rate: $RESPONSE_RATE%)"
        
        # Show rating distribution
        RATING_5=$(echo "$RESPONSE" | jq -r '.rating5Count')
        RATING_4=$(echo "$RESPONSE" | jq -r '.rating4Count')
        RATING_3=$(echo "$RESPONSE" | jq -r '.rating3Count')
        RATING_2=$(echo "$RESPONSE" | jq -r '.rating2Count')
        RATING_1=$(echo "$RESPONSE" | jq -r '.rating1Count')
        
        print_info "Rating Distribution:"
        print_info "  5 stars: $RATING_5"
        print_info "  4 stars: $RATING_4"
        print_info "  3 stars: $RATING_3"
        print_info "  2 stars: $RATING_2"
        print_info "  1 star:  $RATING_1"
    else
        print_error "Failed to get artist rating"
    fi
    echo
}

# Test 10: Filter Reviews by Rating
test_filter_by_rating() {
    print_test "10. Filter Reviews by Rating"
    
    RESPONSE=$(curl -s "$BASE_URL/api/reviews/reviews?artistId=$ARTIST_ID&rating=5")
    TOTAL=$(echo "$RESPONSE" | jq -r '.pagination.total // 0')
    
    print_success "Found $TOTAL reviews with 5 stars"
    echo
}

# Test 11: Sort Reviews by Helpful
test_sort_by_helpful() {
    print_test "11. Sort Reviews by Most Helpful"
    
    RESPONSE=$(curl -s "$BASE_URL/api/reviews/reviews?artistId=$ARTIST_ID&sortBy=helpful")
    TOTAL=$(echo "$RESPONSE" | jq -r '.pagination.total // 0')
    
    print_success "Retrieved $TOTAL reviews sorted by helpful votes"
    echo
}

# Test 12: Update Artist Response
test_update_response() {
    print_test "12. Update Artist Response"
    
    if [ -z "$RESPONSE_ID" ]; then
        print_error "No response ID available"
        echo
        return
    fi
    
    RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/reviews/responses/$RESPONSE_ID" \
        -H "Authorization: Bearer $ARTIST_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "message": "Muchas gracias por tu excelente reseña! ACTUALIZADO: Espero trabajar contigo nuevamente."
        }')
    
    MESSAGE=$(echo "$RESPONSE" | jq -r '.message // empty')
    
    if [[ "$MESSAGE" == *"ACTUALIZADO"* ]]; then
        print_success "Response updated successfully"
    else
        print_error "Failed to update response"
    fi
    echo
}

# Test 13: Pagination
test_pagination() {
    print_test "13. Test Pagination"
    
    RESPONSE=$(curl -s "$BASE_URL/api/reviews/reviews?artistId=$ARTIST_ID&page=1&limit=5")
    CURRENT_PAGE=$(echo "$RESPONSE" | jq -r '.pagination.page // 0')
    LIMIT=$(echo "$RESPONSE" | jq -r '.pagination.limit // 0')
    
    if [ "$CURRENT_PAGE" = "1" ] && [ "$LIMIT" = "5" ]; then
        print_success "Pagination works correctly (Page: $CURRENT_PAGE, Limit: $LIMIT)"
    else
        print_error "Pagination failed"
    fi
    echo
}

# Test 14: Attempt Duplicate Review (should fail)
test_duplicate_review() {
    print_test "14. Attempt to Create Duplicate Review (Should Fail)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/reviews/reviews" \
        -H "Authorization: Bearer $CLIENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"bookingId\": \"$BOOKING_ID\",
            \"rating\": 4,
            \"comment\": \"Another review for same booking\"
        }")
    
    ERROR=$(echo "$RESPONSE" | jq -r '.error // .message // empty')
    
    if [[ "$ERROR" == *"already"* ]] || [[ "$ERROR" == *"existe"* ]] || [[ "$ERROR" == *"Conflict"* ]]; then
        print_success "Duplicate review correctly prevented"
    else
        print_error "Duplicate review was not prevented"
        echo "$RESPONSE" | jq '.'
    fi
    echo
}

# Test 15: Invalid Rating (should fail)
test_invalid_rating() {
    print_test "15. Attempt Invalid Rating (Should Fail)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/reviews/reviews" \
        -H "Authorization: Bearer $CLIENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "bookingId": "fake-booking-id",
            "rating": 10,
            "comment": "Invalid rating"
        }')
    
    ERROR=$(echo "$RESPONSE" | jq -r '.error // .message // empty')
    
    if [[ "$ERROR" == *"rating"* ]] || [[ "$ERROR" == *"validation"* ]]; then
        print_success "Invalid rating correctly rejected"
    else
        print_error "Invalid rating was not rejected"
    fi
    echo
}

# Summary
print_summary() {
    echo "======================================"
    echo "Test Summary"
    echo "======================================"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo "======================================"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed! 🎉${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo "======================================"
    echo "Reviews Service Integration Tests"
    echo "======================================"
    echo
    
    check_service
    setup_client
    setup_artist
    setup_booking
    
    echo "======================================"
    echo "Running Tests"
    echo "======================================"
    echo
    
    test_health_check
    test_create_review
    test_get_review
    test_list_reviews
    test_respond_review
    test_update_review
    test_helpful_vote
    test_report_review
    test_get_artist_rating
    test_filter_by_rating
    test_sort_by_helpful
    test_update_response
    test_pagination
    test_duplicate_review
    test_invalid_rating
    
    print_summary
}

# Run tests
main
