import React from 'react'

interface Props{
    username: string;
    isOnline: boolean;
}

function UserProfile({username, isOnline}: Props) {
  return <div>
    <h2>{username}</h2>
    <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
  </div>
}

export default UserProfile