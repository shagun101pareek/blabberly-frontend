export type FriendUserDTO = {
    _id: string;
    email: string;
    username: string;
    avatar?: string;
  };
  
  export type FriendRequestDTO = {
    _id: string;
    fromUser: FriendUserDTO;
    toUser: string;
    status: "pending" | "accepted" | "rejected";
    createdAt: string;
    updatedAt: string;
  };
  
  export type GetPendingFriendRequestsResponse = {
    requests: FriendRequestDTO[];
  };
  
  export type AcceptFriendRequestResponse = {
    friend: {
      id: string;
      username: string;
      avatar?: string;
    };
  };
  