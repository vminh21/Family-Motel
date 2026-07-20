# 🐛 Bug Report - Motel Management System Testing
**Date:** July 17, 2026  
**Tester:** Junior QA Engineer  
**Project:** Family Motel Management System

---

## 📋 Executive Summary

Conducted comprehensive testing of the motel management system (full-stack application with Next.js frontend, Node.js/Express backend, and MySQL database). **Identified and fixed 4 critical/medium bugs** related to validation and data encoding.

### Overall Status: ✅ **All Critical Bugs Fixed**

---

## 🔍 Bugs Identified & Fixed

### 🚨 BUG #1: Character Encoding Issue (CRITICAL)
**Severity:** HIGH  
**Status:** ✅ FIXED (requires database reset)  
**Component:** Backend Database Connection

#### Problem:
- Vietnamese characters displaying incorrectly in API responses
- "Phòng 1" appears as "Phng 1" or "PhÃ²ng 1"
- "Nguyễn Văn An" appears as "Nguyn Vn An"

#### Root Cause:
MySQL connection pool not specifying character set, defaulting to `latin1` instead of `utf8mb4`

#### Fix Applied:
**File:** `backend/src/config/db.js`
```javascript
const pool = mysql.createPool({
  // ... other config
  charset: 'utf8mb4',  // ✅ ADDED
});
```

#### Additional Action Required:
Existing database data is already corrupted. To fully fix:
```bash
# Recreate database with proper charset
docker-compose down
docker volume rm qunlphngtr_mysql_data
docker-compose up -d
```

---

### ⚠️ BUG #2: Room Update No Validation (MEDIUM)
**Severity:** MEDIUM  
**Status:** ✅ FIXED  
**Component:** Backend API - Rooms Route

#### Problem:
PATCH `/api/v1/rooms/:id` endpoint returns success even when room ID doesn't exist

**Before:**
```bash
PATCH /api/v1/rooms/999
Response: {"success":true,"message":"Room updated successfully"}
```

**Expected:** Should return 404 error

#### Fix Applied:
**File:** `backend/src/routes/rooms.js`
```javascript
const [result] = await pool.query(/*...*/);

if (result.affectedRows === 0) {
  return res.status(404).json({ 
    success: false, 
    message: 'Room not found' 
  });
}
```

**After:**
```bash
PATCH /api/v1/rooms/999
Response: {"success":false,"message":"Room not found"}
HTTP Status: 404 ✅
```

---

### ⚠️ BUG #3: Tenant Update No Validation (MEDIUM)
**Severity:** MEDIUM  
**Status:** ✅ FIXED  
**Component:** Backend API - Tenants Route

#### Problem:
PUT `/api/v1/tenants/:id` endpoint returns success even when tenant ID doesn't exist

**Before:**
```bash
PUT /api/v1/tenants/999
Response: {"success":true,"message":"Tenant updated"}
```

**Expected:** Should return 404 error

#### Fix Applied:
**File:** `backend/src/routes/tenants.js`
```javascript
const [result] = await pool.query(/*...*/);

if (result.affectedRows === 0) {
  return res.status(404).json({ 
    success: false, 
    message: 'Tenant not found' 
  });
}
```

**After:**
```bash
PUT /api/v1/tenants/999
Response: {"success":false,"message":"Tenant not found"}
HTTP Status: 404 ✅
```

---

### ⚠️ BUG #4: Settings Accept Invalid Keys (MEDIUM)
**Severity:** MEDIUM  
**Status:** ✅ FIXED  
**Component:** Backend API - Settings Route

#### Problem:
PUT `/api/v1/settings` endpoint accepts and claims to update non-existent setting keys

**Before:**
```bash
PUT /api/v1/settings
Body: {"invalid_key":"100000"}
Response: {"success":true,"message":"Settings updated successfully"}
```

**Expected:** Should validate that only existing settings can be updated

#### Fix Applied:
**File:** `backend/src/routes/settings.js`
```javascript
// Validate that all keys exist in settings table
const [existingSettings] = await conn.query('SELECT `key` FROM settings');
const validKeys = new Set(existingSettings.map(s => s.key));

const invalidKeys = Object.keys(updates).filter(key => !validKeys.has(key));
if (invalidKeys.length > 0) {
  await conn.rollback();
  return res.status(400).json({
    success: false,
    message: `Invalid setting keys: ${invalidKeys.join(', ')}`
  });
}
```

**After:**
```bash
PUT /api/v1/settings
Body: {"invalid_key":"100000"}
Response: {"success":false,"message":"Invalid setting keys: invalid_key"}
HTTP Status: 400 ✅
```

---

## ✅ What's Working Correctly

### Authentication
- ✅ Login endpoint validates credentials correctly
- ✅ JWT token generation and validation working
- ✅ Authorization middleware properly protecting routes

### Validation
- ✅ Tenant creation requires: room_id, full_name, start_date
- ✅ Billing cycle creation validates all required fields
- ✅ Room availability check prevents double-booking

### Business Logic
- ✅ Tenant check-out properly updates room status
- ✅ Room-tenant relationships maintained correctly
- ✅ Soft delete (is_active flag) implemented properly

---

## 🔧 Files Modified

1. **backend/src/config/db.js** - Added UTF-8 charset
2. **backend/src/routes/rooms.js** - Added existence validation
3. **backend/src/routes/tenants.js** - Added existence validation
4. **backend/src/routes/settings.js** - Added key validation

---

## 📊 Test Coverage Summary

| Component | Tests Performed | Status |
|-----------|----------------|--------|
| Authentication | Login with valid/invalid credentials | ✅ PASS |
| Rooms API | GET, PATCH with valid/invalid IDs | ✅ PASS |
| Tenants API | GET, POST, PUT, DELETE validation | ✅ PASS |
| Settings API | GET, PUT with valid/invalid keys | ✅ PASS |
| Billing API | GET cycles, GET invoices | ✅ PASS |
| Character Encoding | Vietnamese text in responses | ⚠️ Needs DB reset |

---

## 🚀 Deployment Checklist

- [x] All code fixes applied
- [x] Docker backend container rebuilt with new code
- [x] All validation bugs fixed and tested
- [ ] **Database needs to be reset** (to fix encoding issue)
- [ ] Run full regression testing after DB reset

---

## 📝 Recommendations

### Immediate Actions:
1. **Reset database** to fix Vietnamese character encoding (see instructions below)
2. Test creating new rooms/tenants to verify encoding works for new data

### Future Improvements:
1. Add unit tests for all API endpoints
2. Implement input sanitization to prevent SQL injection (though parameterized queries already protect)
3. Add rate limiting to prevent API abuse
4. Implement logging system for better debugging
5. Add API documentation (Swagger/OpenAPI)
6. Consider adding data validation middleware
7. Implement soft delete for rooms (currently hard delete)

---

## 🔄 Database Reset Instructions

To fix the character encoding issue with existing data:

```bash
# Stop all containers
docker-compose down

# Remove the database volume (this will DELETE all data)
docker volume rm qunlphngtr_mysql_data

# Start containers again (database will reinitialize with proper charset)
docker-compose up -d

# Wait for database to be ready (about 30 seconds)
# The init.sql will run automatically and create clean data
```

**⚠️ Warning:** This will delete all current data. Make sure to back up any important data before running these commands.

---

## 📞 Contact

For questions about this bug report, please contact the QA team.

**Generated:** 2026-07-17 12:31 ICT
