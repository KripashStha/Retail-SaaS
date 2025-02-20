import { NextResponse } from 'next/server';
import { db } from '@/firebase/dbConfig';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('POST request body:', body);

    const { name, price, quantity, threshold = 0, category = '', barcode = '', businessId } = body;

    // Validate inputs
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    if (!price || isNaN(parseFloat(price))) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }
    
    if (!quantity || isNaN(parseInt(quantity))) {
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 });
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Create product document
    try {
      const newProduct = await addDoc(collection(db, 'products'), {
        name: name.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        threshold: parseInt(threshold, 10) || 0,
        category: category || '',
        barcode: barcode || '',
        businessId: businessId,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({
        id: newProduct.id,
        name,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        threshold: parseInt(threshold, 10) || 0,
        category,
        barcode,
        businessId,
        success: true,
        message: 'Product added successfully'
      }, { status: 201 });

    } catch (dbError) {
      console.error('Firebase error:', dbError);
      if (dbError.code) {
        console.error('Firebase error code:', dbError.code);
      }
      throw dbError;
    }

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ 
      error: 'Failed to create product',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Get businessId from searchParams
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Create a query to filter products by businessId
    const productsQuery = query(
      collection(db, 'products'),
      where("businessId", "==", businessId)
    );
    
    const querySnapshot = await getDocs(productsQuery);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// Handle updating a product by ID
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('PUT request body:', body);

    const { id, name, price, quantity, threshold = 0, category = '', barcode = '', businessId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // First check if the product exists
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify this product belongs to the business
    const productData = productSnap.data();
    if (productData.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized access to this product' }, { status: 403 });
    }

    // Prepare update data with validation
    const updateData = {
      name: name?.trim() || productData.name,
      price: !isNaN(parseFloat(price)) ? parseFloat(price) : productData.price,
      quantity: !isNaN(parseInt(quantity)) ? parseInt(quantity, 10) : productData.quantity,
      threshold: !isNaN(parseInt(threshold)) ? parseInt(threshold, 10) : (productData.threshold || 0),
      category: category !== undefined ? category : (productData.category || ''),
      barcode: barcode !== undefined ? barcode : (productData.barcode || '')
    };

    await updateDoc(productRef, updateData);

    return NextResponse.json({ 
      id, 
      ...updateData,
      businessId,
      success: true,
      message: 'Product updated successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    console.log('DELETE request body:', body);

    const { id, businessId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // First check if the product exists
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify this product belongs to the business
    const productData = productSnap.data();
    if (productData.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized access to this product' }, { status: 403 });
    }

    await deleteDoc(productRef);

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      success: true,
      id
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}