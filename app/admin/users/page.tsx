"use client";

import { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  Shield, 
  Music, 
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Calendar
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'CREATOR' | 'ADMIN';
  createdAt: string;
  lastActive?: string;
  isVerified: boolean;
  hasTapPass: boolean;
  tapBalance: number;
  totalTracks: number;
  totalPlays: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}

const RoleBadge = ({ role }: { role: string }) => {
  const colors = {
    USER: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
    CREATOR: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
    ADMIN: 'bg-red-400/20 text-red-300 border-red-400/30'
  };
  
  const icons = {
    USER: <Users className="h-3 w-3" />,
    CREATOR: <Music className="h-3 w-3" />,
    ADMIN: <Shield className="h-3 w-3" />
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[role as keyof typeof colors]}`}>
      {icons[role as keyof typeof icons]}
      {role}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    ACTIVE: 'bg-green-400/20 text-green-300 border-green-400/30',
    SUSPENDED: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    BANNED: 'bg-red-400/20 text-red-300 border-red-400/30'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white/60">Loading user management...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-400" />
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-purple-200">User Management</div>
              <h1 className="text-4xl font-bold text-white">Platform Users</h1>
              <p className="text-white/60">Manage user accounts, roles, and permissions</p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-purple-400/30 bg-purple-400/10 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-300" />
              <div>
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <div className="text-sm text-purple-100">Total Users</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-4">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-blue-300" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.role === 'CREATOR').length}
                </div>
                <div className="text-sm text-blue-100">Creators</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-red-300" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.role === 'ADMIN').length}
                </div>
                <div className="text-sm text-red-100">Admins</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.status === 'ACTIVE').length}
                </div>
                <div className="text-sm text-green-100">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
          >
            <option value="">All Roles</option>
            <option value="USER">Users</option>
            <option value="CREATOR">Creators</option>
            <option value="ADMIN">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    TAP Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {user.username}
                            {user.isVerified && <CheckCircle className="h-4 w-4 text-blue-400" />}
                            {user.hasTapPass && <Crown className="h-4 w-4 text-yellow-400" />}
                          </div>
                          <div className="text-sm text-white/60">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {user.tapBalance.toLocaleString()} TAP
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      <div>
                        <div>{user.totalTracks} tracks</div>
                        <div>{user.totalPlays.toLocaleString()} plays</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                        >
                          <option value="USER">User</option>
                          <option value="CREATOR">Creator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="SUSPENDED">Suspended</option>
                          <option value="BANNED">Banned</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
