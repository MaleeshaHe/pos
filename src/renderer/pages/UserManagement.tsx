import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  Users,
  Plus,
  Edit,
  Power,
  Shield,
  Search,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

const UserManagement = () => {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'cashier',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await window.api.getUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        toast.error(t('users.loadFailed'));
      }
    } catch (error) {
      toast.error(t('users.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update existing user
        const result = await window.api.updateUser(editingUser.id, formData);
        if (result.success) {
          toast.success(t('users.updateSuccess'));
          await window.api.createActivityLog({
            userId: currentUser?.id || 0,
            action: 'UPDATE_USER',
            module: 'users',
            details: `Updated user: ${formData.fullName}`,
          });
        } else {
          toast.error(t('users.updateFailed'));
        }
      } else {
        // Create new user
        const result = await window.api.createUser(formData);
        if (result.success) {
          toast.success(t('users.createSuccess'));
          await window.api.createActivityLog({
            userId: currentUser?.id || 0,
            action: 'CREATE_USER',
            module: 'users',
            details: `Created user: ${formData.fullName} (${formData.role})`,
          });
        } else {
          toast.error(t('users.createFailed'));
        }
      }

      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      toast.error(t('users.saveFailed'));
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const result = await window.api.toggleUserStatus(user.id);
      if (result.success) {
        toast.success(
          user.isActive ? t('users.deactivateSuccess') : t('users.activateSuccess')
        );
        await window.api.createActivityLog({
          userId: currentUser?.id || 0,
          action: user.isActive ? 'DEACTIVATE_USER' : 'ACTIVATE_USER',
          module: 'users',
          details: `${user.isActive ? 'Deactivated' : 'Activated'} user: ${user.fullName}`,
        });
        loadUsers();
      }
    } catch (error) {
      toast.error(t('users.statusChangeFailed'));
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't pre-fill password for security
      fullName: user.fullName,
      role: user.role,
      email: user.email || '',
      phone: user.phone || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'cashier',
      email: '',
      phone: '',
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'cashier':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    return <Shield size={16} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('users.title')}</h1>
          <p className="text-gray-600">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus size={20} />
          {t('users.addUser')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('users.totalUsers')}</p>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('users.activeUsers')}</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
            <Power className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('users.admins')}</p>
              <p className="text-2xl font-bold text-red-600">
                {users.filter((u) => u.role === 'admin').length}
              </p>
            </div>
            <Shield className="text-red-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('users.cashiers')}</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.role === 'cashier').length}
              </p>
            </div>
            <Users className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('users.user')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('users.role')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('users.contact')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('users.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('users.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {t('users.noUsers')}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {getRoleIcon(user.role)}
                      {t(`users.role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email || '-'}</div>
                    <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? t('users.active') : t('users.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title={t('common.edit')}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`${
                        user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                      }`}
                      title={user.isActive ? t('users.deactivate') : t('users.activate')}
                    >
                      <Power size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingUser ? t('users.editUser') : t('users.addUser')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.username')}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.fullName')}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.password')} {editingUser && `(${t('users.leaveBlankToKeep')})`}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.role')}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cashier">{t('users.roleCashier')}</option>
                  <option value="manager">{t('users.roleManager')}</option>
                  <option value="admin">{t('users.roleAdmin')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingUser ? t('common.save') : t('users.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
