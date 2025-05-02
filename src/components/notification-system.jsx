"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, AlertTriangle, X, RefreshCw, PlusCircle, Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const { toast } = useToast();

  // Fetch business ID and set up notification listener
  useEffect(() => {
    const fetchBusinessData = async () => {
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
            setBusinessId(businessId);
            
            // Set up real-time listener for notifications with proper ordering
            const notificationsQuery = query(
              collection(db, "notifications"),
              where("businessId", "==", businessId),
              orderBy("timestamp", "desc")
            );
            
            const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
              const notificationData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
              }));
              
              setNotifications(notificationData);
              setUnreadCount(notificationData.filter(n => !n.read).length);
              setLoading(false);
            }, (error) => {
              console.error("Notification listener error:", error);
              toast({
                title: "Error",
                description: "Failed to load notifications",
                variant: "destructive",
              });
              setLoading(false);
            });
            
            return () => unsubscribe();
          }
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
        toast({
          title: "Error",
          description: "Failed to load business data",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchBusinessData();
  }, []);

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive",
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      
      const unreadNotifications = notifications.filter(n => !n.read);
      
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, "notifications", notification.id);
        batch.update(notificationRef, { read: true });
      });
      
      await batch.commit();
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          read: true
        }))
      );
      
      // Update unread count
      setUnreadCount(0);
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive",
      });
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
    const now = new Date();
    const date = new Date(timestamp);
    
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'out_of_stock':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'inventory_update':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'new_product':
        return <PlusCircle className="h-4 w-4 text-green-500" />;
      case 'bulk_update':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'sale':
        return <Bell className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Stay updated on your inventory status
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="flex items-center gap-1"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <ScrollArea className="h-[680px]">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start p-3 rounded-md ${
                        !notification.read
                          ? "bg-muted/50 border-l-4 border-primary"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="mr-3 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 h-6 w-6"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Mark as read</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="unread">
            <ScrollArea className="h-[680px]">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading notifications...</p>
                </div>
              ) : unreadCount > 0 ? (
                <div className="space-y-2">
                  {notifications
                    .filter((n) => !n.read)
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start p-3 rounded-md bg-muted/50 border-l-4 border-primary"
                      >
                        <div className="mr-3 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 h-6 w-6"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Mark as read</span>
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <CheckCheck className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No unread notifications</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 