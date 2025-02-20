import { db } from '@/firebase/dbConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get businessId from searchParams
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Create a query to filter categories by businessId
    const categoriesQuery = query(
      collection(db, 'categories'),
      where("businessId", "==", businessId)
    );
    
    const querySnapshot = await getDocs(categoriesQuery);
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// Add a new category
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, businessId } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Check if category already exists for this business
    const categoriesRef = collection(db, 'categories');
    const q = query(
      categoriesRef, 
      where('name', '==', name.trim()),
      where('businessId', '==', businessId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return NextResponse.json({ error: 'Category already exists for this business' }, { status: 409 });
    }

    // Add category to Firestore with businessId
    const newCategory = await addDoc(collection(db, 'categories'), {
      name: name.trim(),
      businessId: businessId,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      id: newCategory.id, 
      name, 
      businessId,
      success: true,
      message: 'Category added successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding category:', error);
    return NextResponse.json({ error: 'Failed to add category', details: error.message }, { status: 500 });
  }
}

// Delete a category
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id, businessId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // First check if the category exists
    const categoryRef = doc(db, 'categories', id);
    const categorySnap = await getDoc(categoryRef);
    
    if (!categorySnap.exists()) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Verify this category belongs to the business
    const categoryData = categorySnap.data();
    if (categoryData.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized access to this category' }, { status: 403 });
    }

    await deleteDoc(categoryRef);

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      success: true,
      id
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}