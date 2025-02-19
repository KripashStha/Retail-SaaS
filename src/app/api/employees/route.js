import { db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { NextResponse } from "next/server";

// Get employees and invitations
export async function GET(request) {
  try {
    // Get businessId from searchParams instead of body
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // Fetch active users
    const usersQuery = query(
      collection(db, "Users"),
      where("businessId", "==", businessId),
      where("status", "==", "active")
    );
    const usersSnapshot = await getDocs(usersQuery);
    const usersData = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch pending invitations
    const invitationsQuery = query(
      collection(db, "invitations"),
      where("businessId", "==", businessId),
      where("status", "==", "pending_invite")
    );
    const invitationsSnapshot = await getDocs(invitationsQuery);
    const invitationsData = invitationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ users: [...usersData, ...invitationsData] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create invitation
export async function POST(request) {
  try {
    const inviteData = await request.json();
    const inviteRef = await addDoc(collection(db, "invitations"), inviteData);
    
    return NextResponse.json({ 
      id: inviteRef.id, 
      ...inviteData 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update user
export async function PUT(request) {
  try {
    const { id, role } = await request.json();
    
    // Update user in Firestore
    await updateDoc(doc(db, "Users", id), {
      role: role,
    });
    
    return NextResponse.json({ 
      success: true,
      message: "User role updated successfully" 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete user or cancel invitation
export async function DELETE(request) {
  try {
    const { id, type } = await request.json();
    const collection = type === 'invitation' ? 'invitations' : 'Users';
    
    await deleteDoc(doc(db, collection, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 