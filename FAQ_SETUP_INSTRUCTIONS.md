# FAQ System Setup Instructions for Shopify Admin

This document explains how to properly configure the metafield and metaobject in Shopify Admin for the FAQ system.

## 1. Create the FAQ Metaobject Definition

### Step 1: Go to Metaobjects
1. In Shopify Admin, go to **Settings** → **Custom data** → **Metaobjects**
2. Click **Add definition** or **Create metaobject**

### Step 2: Configure the Metaobject
- **Name**: `FAQ` (or `faq` - must match the code)
- **Type**: `faq` (this is the identifier used in the code)
- **Access**: Make sure it's set to **Storefront** (so it can be accessed via Storefront API)
- **Status**: Should support **Draft** and **Active** statuses (for publishable capability)

### Step 3: Add Fields to the Metaobject

⚠️ **IMPORTANT**: Each field should be a **SINGLE VALUE** (not a list). Each FAQ metaobject represents ONE FAQ entry.

Add the following fields in this exact order:

#### Field 1: `faq_question`
- **Field name**: `faq_question`
- **Field type**: `Single line text`
- **List of values**: ❌ **NO** (Single value only)
- **Required**: ✅ Yes
- **Description**: The question asked by the user

#### Field 2: `faq_answer`
- **Field name**: `faq_answer`
- **Field type**: `Rich text` (or `Multi-line text` if Rich text is not available)
- **List of values**: ❌ **NO** (Single value only)
- **Required**: ✅ Yes
- **Description**: The AI-generated answer to the question

#### Field 3: `faq_name` (Optional but recommended)
- **Field name**: `faq_name`
- **Field type**: `Single line text`
- **List of values**: ❌ **NO** (Single value only)
- **Required**: ❌ No
- **Description**: The name of the person who asked the question

#### Field 4: `faq_email` (Optional)
- **Field name**: `faq_email`
- **Field type**: `Email` or `Single line text`
- **List of values**: ❌ **NO** (Single value only)
- **Required**: ❌ No
- **Description**: The email of the person who asked the question

#### Field 5: `faq_product` ⚠️ **REQUIRED**
- **Field name**: `faq_product`
- **Field type**: `Product reference` (or `Single line text` if Product reference is not available)
- **List of values**: ❌ **NO** (Single value only)
- **Required**: ✅ **YES** (This is critical - stores which product the FAQ belongs to)
- **Description**: The product this FAQ is associated with

**Why this field?** This eliminates race conditions! Instead of maintaining a list in the product metafield (which gets overwritten), each FAQ stores its own product reference. This way, multiple FAQs can be created simultaneously without conflicts.

### Step 4: Save the Metaobject Definition
- Click **Save** to create the metaobject definition

---

## 2. Product Metafield (NO LONGER NEEDED!)

⚠️ **IMPORTANT CHANGE**: We no longer use a product metafield to store FAQ references!

**Old Approach (REMOVED)**: Product metafield `custom.faqs` containing a list of FAQ references
- ❌ This caused race conditions when multiple FAQs were created simultaneously
- ❌ Each new FAQ would overwrite the list, removing old FAQs

**New Approach (CURRENT)**: Each FAQ stores its own product reference in the `faq_product` field
- ✅ No race conditions - each FAQ creation is independent
- ✅ FAQs are queried by filtering metaobjects where `faq_product = productId`
- ✅ Multiple FAQs can be created simultaneously without conflicts

**You do NOT need to create a product metafield anymore!** The `faq_product` field in the FAQ metaobject is sufficient.

---

## 3. Verify the Setup

### Check Metaobject Definition
1. Go to **Settings** → **Custom data** → **Metaobjects**
2. Find your `FAQ` metaobject
3. Verify all fields are present:
   - ✅ `faq_question` (Single line text)
   - ✅ `faq_answer` (Rich text or Multi-line text)
   - ✅ `faq_name` (Single line text, optional)
   - ✅ `faq_email` (Email or Single line text, optional)

### Check Product Metafield
1. Go to **Settings** → **Custom data** → **Metafields**
2. Find `custom.faqs` metafield
3. Verify:
   - ✅ Type is "List of metaobjects"
   - ✅ Metaobject type is "FAQ"
   - ✅ Storefront access is enabled

### Test the Setup
1. Go to any product page
2. Scroll to the FAQ section
3. Try submitting a question
4. Check the browser console for any errors
5. Verify the FAQ appears immediately

---

## 4. Troubleshooting

### Issue: "Field definition does not exist"
- **Solution**: Make sure the field names in Shopify Admin match exactly:
  - `faq_question` (not `question` or `FAQ Question`)
  - `faq_answer` (not `answer` or `FAQ Answer`)
  - `faq_name` (not `name` or `FAQ Name`)
  - `faq_email` (not `email` or `FAQ Email`)

### Issue: "Metafield not found"
- **Solution**: Verify the metafield namespace and key are exactly:
  - Namespace: `custom`
  - Key: `faqs`
  - Full identifier: `custom.faqs`

### Issue: "Metaobject type not found"
- **Solution**: Verify the metaobject type identifier is exactly `faq` (lowercase)

### Issue: FAQs not appearing
- **Solution**: 
  1. Check that Storefront access is enabled for both the metaobject and metafield
  2. Verify the metaobject status is set to "Active" (not "Draft")
  3. Check browser console for API errors

### Issue: "Value is invalid JSON"
- **Solution**: 
  - If using Rich text field: The code handles this automatically
  - If using Multi-line text: Should work as plain text
  - Make sure the `faq_answer` field type matches what the code expects

---

## 5. Important Notes

1. **Field Names**: Field names in Shopify Admin must match exactly (case-sensitive):
   - `faq_question` ✅
   - `FAQ_question` ❌
   - `faq_Question` ❌

2. **Metaobject Type**: The metaobject type identifier must be `faq` (lowercase)

3. **Metafield Identifier**: Must be `custom.faqs` (namespace: `custom`, key: `faqs`)

4. **Storefront Access**: Both the metaobject and metafield must have Storefront access enabled

5. **Publishable**: The metaobject should support status (Draft/Active) for the publish functionality to work

---

## 6. Alternative: Using Product Reference in FAQ Metaobject

For a more robust solution that eliminates race conditions, you could:

1. Add a `product_reference` field to the FAQ metaobject
2. Store the product ID in each FAQ instead of maintaining a list in the product metafield
3. Query FAQs by filtering metaobjects where `product_reference` equals the product ID

This approach eliminates the race condition entirely but requires code changes.

---

## Quick Reference

| Item | Value |
|------|-------|
| Metaobject Type | `faq` |
| Metaobject Fields | `faq_question`, `faq_answer`, `faq_name`, `faq_email` |
| Product Metafield | `custom.faqs` |
| Metafield Type | List of metaobjects (FAQ) |
| Storefront Access | Required for both |

