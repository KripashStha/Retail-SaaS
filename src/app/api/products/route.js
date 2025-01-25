import { NextResponse } from 'next/server';
import { db } from '@/firebase/dbConfig';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

// export async function POST(request) {
//   try {
//     const body = await request.json();
//     console.log('POST request body:', body); // Add logging

//     const { name, price, quantity, description = '' } = body;

//     if (!name || !price || !quantity) {
//       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
//     }

//     const newProduct = await addDoc(collection(db, 'products'), {
//       name,
//       price: parseFloat(price),
//       quantity: parseInt(quantity, 10),
//       description,
//     });

//     return NextResponse.json({ id: newProduct.id, name, price, quantity, description }, { status: 201 });
//   } catch (error) {
//     console.error('Error creating product:', error);
//     return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
//   }
// }

// api/products/route.js
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('POST request body:', body);

    const { name, price, quantity, description = '' } = body;

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

    // Create product document
    try {
      const newProduct = await addDoc(collection(db, 'products'), {
        name: name.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        description: description.trim(),
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({
        id: newProduct.id,
        name,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        description
      }, { status: 201 });

    } catch (dbError) {
      console.error('Firebase error:', dbError);
      // Log specific Firebase error code
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

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
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

export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('PUT request body:', body); // Add logging

    const { id, name, price, quantity, description = '' } = body;

    if (!id || !name || !price || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, { name, price: parseFloat(price), quantity: parseInt(quantity, 10), description });

    return NextResponse.json({ id, name, price, quantity, description }, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    console.log('DELETE request body:', body); // Add logging

    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}