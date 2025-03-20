import { NextResponse } from 'next/server';
import { db } from '@/firebase/dbConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

// Create a new notification
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, type, businessId, productId } = body;

    // Validate inputs
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Create notification document
    const newNotification = await addDoc(collection(db, 'notifications'), {
      title: title.trim(),
      message: message.trim(),
      type: type || 'general',
      businessId,
      productId: productId || null,
      read: false,
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({
      id: newNotification.id,
      success: true,
      message: 'Notification created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// Mark notification(s) as read
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, businessId, markAll } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    if (markAll) {
      // Mark all notifications as read
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('businessId', '==', businessId),
        where('read', '==', false)
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      const updatePromises = notificationsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } else if (id) {
      // Mark a single notification as read
      const notificationRef = doc(db, 'notifications', id);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
      
      // Verify the notification belongs to the business
      if (notificationDoc.data().businessId !== businessId) {
        return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
      }
      
      await updateDoc(notificationRef, { read: true });
      
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// Get notifications for a business
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }
    
    let notificationsQuery;
    
    if (unreadOnly) {
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('businessId', '==', businessId),
        where('read', '==', false)
      );
    } else {
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('businessId', '==', businessId)
      );
    }
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
    }));
    
    return NextResponse.json(notifications);

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
} 