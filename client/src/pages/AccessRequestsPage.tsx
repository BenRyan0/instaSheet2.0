import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { AuthUser } from '../types';
import { authApi } from '../api/client';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingScreen } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

export const AccessRequestsPage: React.FC = () => {
  const qc = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['auth-users'],
    queryFn: () => authApi.getUsers(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => authApi.approve(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['auth-users'] });
      toast.success('User approved');
    },
    onError: () => toast.error('Failed to approve user'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => authApi.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth-users'] });
      toast.success('Request rejected');
    },
    onError: () => toast.error('Failed to reject request'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth-users'] });
      toast.success('User removed');
    },
    onError: () => toast.error('Failed to remove user'),
  });

  const allUsers: AuthUser[] = usersData?.data ?? [];
  const pending = allUsers.filter((u) => u.status === 'pending');
  const active = allUsers.filter((u) => u.status === 'active');
  const rejected = allUsers.filter((u) => u.status === 'rejected');

  const statusBadge = (status: AuthUser['status']) => {
    const map = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      rejected: 'bg-red-100 text-red-500',
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      <Card>
        <CardHeader
          title="Pending Access Requests"
          subtitle={`${pending.length} waiting for approval`}
        />
        {isLoading ? (
          <LoadingScreen />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No pending requests"
            description="All access requests have been reviewed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Username</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Requested</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">{u.username}</code>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(u._id)}
                          loading={approveMutation.isPending && approveMutation.variables === u._id}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => rejectMutation.mutate(u._id)}
                          loading={rejectMutation.isPending && rejectMutation.variables === u._id}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* All users */}
      <Card>
        <CardHeader
          title="All Users"
          subtitle={`${allUsers.length} total`}
        />
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Username</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Created</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">{u.username}</code>
                    </td>
                    <td className="px-6 py-4">{statusBadge(u.status)}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {u.status === 'pending' && (
                          <Button size="sm" onClick={() => approveMutation.mutate(u._id)}>
                            Approve
                          </Button>
                        )}
                        {u.status === 'rejected' && (
                          <Button size="sm" variant="secondary" onClick={() => approveMutation.mutate(u._id)}>
                            Re-approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(u._id)}
                          loading={deleteMutation.isPending && deleteMutation.variables === u._id}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
