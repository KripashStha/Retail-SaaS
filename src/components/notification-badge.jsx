"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { auth, db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

export function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (auth.currentUser) {
          const userDoc = await getDocs(
            query(
              collection(db, "Users"),
              where("email", "==", auth.currentUser.email)
            )
          );
          
          if (!userDoc.empty) {
            const businessId = userDoc.docs[0].data().businessId;
            
            // Set up real-time listener for unread notifications
            const notificationsQuery = query(
              collection(db, "notifications"),
              where("businessId", "==", businessId),
              where("read", "==", false),
              orderBy("timestamp", "desc")
            );
            
            const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
              setUnreadCount(snapshot.docs.length);
              setLoading(false);
            }, (error) => {
              console.error("Notification badge error:", error);
              setLoading(false);
            });
            
            return () => unsubscribe();
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);

  if (loading) return <Bell className="h-5 w-5" />;

  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </div>
  );
} 