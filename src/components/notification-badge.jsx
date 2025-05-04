"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { auth, db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy,
} from "firebase/firestore";

export function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);

  // First, get the business ID when component mounts or auth changes
  useEffect(() => {
    const fetchBusinessId = async () => {
      try {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }

        const userQuery = query(
          collection(db, "Users"),
          where("email", "==", auth.currentUser.email)
        );

        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setBusinessId(userData.businessId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchBusinessId();
      } else {
        setBusinessId(null);
        setUnreadCount(0);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up a listener for unread notifications when we have a business ID
  useEffect(() => {
    if (!businessId) return;

    // Create a query for unread notifications
    const unreadQuery = query(
      collection(db, "notifications"),
      where("businessId", "==", businessId),
      where("read", "==", false)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      unreadQuery,
      (snapshot) => {
        const count = snapshot.docs.length;
        setUnreadCount(count);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [businessId]);

  // While loading, show a subtle loading indicator
  if (loading) {
    return (
      <div className="relative">
        <Bell className="h-5 w-5 text-muted" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
        </span>
      </div>
    );
  }

  // When loaded, show notification bell with badge if there are unread notifications
  return (
    <div className="relative">
      <Bell className="h-5 w-5 mr-3" />
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-1 -right-44 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white border-none"
          variant="destructive"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </div>
  );
}
