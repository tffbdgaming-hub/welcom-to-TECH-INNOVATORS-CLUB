export interface UserData {
  id: string;
  name: string;
  role: string;
  fatherName: string;
  motherName: string;
  session: string;
  department: string;
  idNumber: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface KeyLog {
  id: string;
  userId: string;
  userRole: string;
  userIdNumber: string;
  paski: string;
  timestamp: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  timestamp: number;
}

export interface Comment {
  id: string;
  noticeId: string;
  userId: string;
  userName: string;
  userIdNumber: string;
  text: string;
  timestamp: number;
}

export interface UpdateRequest {
  id: string;
  userId: string;
  requestedChanges: Partial<UserData>;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: number;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  timestamp: number;
}
