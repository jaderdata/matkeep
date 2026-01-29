import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge } from '../components/UI';
import { Save, History, Shield, Loader2, Camera, User, ClipboardList, Lock } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Academy } from '../types';
import { useRef } from 'react';
import { formatUSPhone } from '../utils';
import { logAuditActivity, getRecentAuditLogs, getActionDisplayName, AuditLog } from '../services/auditService';

const AcademySettings: React.FC = () => {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAcademy();
    fetchUser();
    setNewPassword('');
    setConfirmPassword('');
  }, []);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setAdminEmail(session.user.email);
      // Check if user is Master
      setIsMaster(session.user.email === 'jader_dourado@hotmail.com');
    }
  };

  const fetchAcademy = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;

      let query = supabase.from('academies').select('*');

      if (session.user.email !== 'jader_dourado@hotmail.com') {
        query = query.eq('admin_email', session.user.email);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) throw error;

      if (data) {
        setAcademy({
          id: data.id,
          name: data.name,
          address: data.address,
          contact: data.contact,
          logoUrl: data.logo_url,
          slug: data.slug,
          settings: {
            yellowFlagDays: data.yellow_flag_days,
            redFlagDays: data.red_flag_days
          }
        });

        // Fetch audit logs for this academy
        await fetchAuditLogs(data.id);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da academia:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (academyId: string) => {
    try {
      const logs = await getRecentAuditLogs(academyId, 5);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const handleSave = async () => {
    if (!academy) return;
    setSaving(true);
    setMessage(null);
    try {
      // Fetch current academy data to preserve name and address if user is not Master
      const { data: currentAcademy } = await supabase
        .from('academies')
        .select('name, address')
        .eq('id', academy.id)
        .single();

      // Prepare update data
      const updateData: any = {
        id: academy.id,
        contact: academy.contact,
        logo_url: academy.logoUrl,
        slug: academy.slug || null,
        yellow_flag_days: academy.settings.yellowFlagDays,
        red_flag_days: academy.settings.redFlagDays
      };

      // Only Master can update name and address
      if (isMaster) {
        updateData.name = academy.name;
        updateData.address = academy.address;
      } else {
        // Preserve original values for non-Master users
        updateData.name = currentAcademy?.name;
        updateData.address = currentAcademy?.address;
      }

      const { error } = await supabase
        .from('academies')
        .upsert(updateData);

      if (error) throw error;

      // Log the activity
      await logAuditActivity(
        academy.id,
        'update_academy_settings',
        'Updated academy settings',
        {
          fields: Object.keys(updateData).filter(k => k !== 'id'),
          isMaster
        }
      );

      setMessage({ type: 'success', text: 'Settings saved successfully!' });

      // Emitir evento para atualizar o layout (opcional se houver um context)
      window.dispatchEvent(new Event('academy_updated'));

      // Refresh audit logs
      await fetchAuditLogs(academy.id);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !academy) return;

    try {
      setSaving(true);
      // Aqui poderíamos fazer o upload para o Supabase Storage
      // Por enquanto, vamos converter para base64 para demonstração imediata
      // ou apenas simular a atualização se o usuário não configurou o bucket
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setAcademy({ ...academy, logoUrl: base64String });

        // Tentar salvar no banco
        const { error } = await supabase
          .from('academies')
          .update({ logo_url: base64String })
          .eq('id', academy.id);

        if (error) throw error;

        // Log the activity
        await logAuditActivity(
          academy.id,
          'update_academy_logo',
          'Updated academy logo'
        );

        setMessage({ type: 'success', text: 'Logo updated successfully!' });

        // Refresh audit logs
        await fetchAuditLogs(academy.id);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao atualizar logo:', err);
      setMessage({ type: 'error', text: 'Failed to update logo.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must have at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Log the activity
      if (academy) {
        await logAuditActivity(
          academy.id,
          'change_password',
          'Changed account password'
        );

        // Refresh audit logs
        await fetchAuditLogs(academy.id);
      }

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      alert('Error: ' + (err.message || 'Failed to change password. Please check if you are logged in.'));
    } finally {
      setSaving(false);
    }
  };

  const openPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Settings</h2>
          <p className="text-gray-500 text-sm">Manage your academy's data and monitoring rules.</p>
        </div>
        {message && (
          <div className={`px-4 py-2 text-xs font-bold uppercase ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="p-4 border-b border-gray-300">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">General Data</h3>
            </div>
            {!isMaster && (
              <div className="p-3 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2">
                <Lock size={14} className="text-yellow-600" />
                <p className="text-[10px] text-yellow-700 font-semibold uppercase">
                  Academy Name and Address are restricted. Only Master profile can modify these fields.
                </p>
              </div>
            )}
            <div className="p-6 space-y-4">
              <Input
                label="Academy Name"
                value={academy?.name || ''}
                onChange={e => setAcademy(prev => prev ? { ...prev, name: e.target.value } : null)}
                autoComplete="new-password"
                disabled={!isMaster}
              />
              <Input
                label="Full Address"
                value={academy?.address || ''}
                onChange={e => setAcademy(prev => prev ? { ...prev, address: e.target.value } : null)}
                autoComplete="new-password"
                disabled={!isMaster}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact / Phone"
                  placeholder="(000) 000-0000"
                  value={academy?.contact || ''}
                  onChange={e => setAcademy(prev => prev ? { ...prev, contact: formatUSPhone(e.target.value) } : null)}
                  autoComplete="new-password"
                />
                <Input
                  label="Admin Email (Login)"
                  value={adminEmail}
                  disabled
                  helperText="This email is used for login and cannot be visually changed here."
                />
              </div>
              <div className="mt-4">
                <Input
                  label="Custom Registration Link (Slug)"
                  value={academy?.slug || ''}
                  onChange={e => {
                    // Only allow alphanumeric and hyphens
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setAcademy(prev => prev ? { ...prev, slug: val } : null);
                  }}
                  placeholder="e.g. my-academy-name"
                  helperText={academy?.slug
                    ? `Your link: https://matkeep.vercel.app/#/public/register/${academy.slug}`
                    : 'Create a friendly URL for your registration link (optional).'}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase">Current Logo</label>
                <div className="flex items-center gap-4">
                  <img src={academy?.logoUrl || 'https://via.placeholder.com/150'} className="w-12 h-12 border border-gray-300 object-cover" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <Button
                    variant="secondary"
                    className="text-[10px] py-1 flex items-center gap-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={12} /> Change
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Churn Monitoring</h3>
              <Badge color="yellow">Alert Configuration</Badge>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Yellow Flag</p>
                  <p className="text-xs text-gray-500">Days without attendance to signal attention.</p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={academy?.settings.yellowFlagDays || 7}
                    onChange={e => setAcademy(prev => prev ? { ...prev, settings: { ...prev.settings, yellowFlagDays: parseInt(e.target.value) } } : null)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Red Flag</p>
                  <p className="text-xs text-gray-500">Days without attendance for high risk.</p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={academy?.settings.redFlagDays || 14}
                    onChange={e => setAcademy(prev => prev ? { ...prev, settings: { ...prev.settings, redFlagDays: parseInt(e.target.value) } } : null)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              className="flex items-center gap-2 px-8"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-4 border-b border-gray-300">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Shield size={14} /> Security
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <button
                onClick={openPasswordModal}
                className="text-xs font-bold uppercase text-gray-600 hover:text-gray-900 w-full text-left p-2 border border-transparent hover:border-gray-200 flex items-center gap-2"
              >
                <User size={14} /> Change My Password
              </button>

            </div>
          </Card>

          <Card>
            <div className="p-4 border-b border-gray-300">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <History size={14} /> Recent Audit
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="text-[10px] leading-tight">
                  <p className="font-bold text-gray-900 uppercase">Administrator</p>
                  <p className="text-gray-500 italic">No recent activity recorded.</p>
                  <p className="text-[8px] uppercase mt-1">{new Date().toLocaleDateString('en-US')}</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="text-[10px] leading-tight border-b border-gray-100 pb-2 last:border-0">
                    <p className="font-bold text-gray-900 uppercase">{getActionDisplayName(log.action)}</p>
                    <p className="text-gray-600">{log.description}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-gray-400 text-[9px]">{log.user_email}</p>
                      <p className="text-[8px] uppercase text-gray-400">
                        {new Date(log.created_at || '').toLocaleString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div >

      {/* Password Change Modal */}
      {
        showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl">
              <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest">Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-900">&times;</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="p-6 space-y-4" autoComplete="off">
                <p className="text-xs text-gray-500">Enter your new password below. It must be at least 6 characters.</p>
                <Input
                  type="password"
                  label="New Password"
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <Input
                  type="password"
                  label="Confirm New Password"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={saving}
                  >
                    {saving ? 'Updating...' : 'Confirm Change'}
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )
      }
    </div >
  );
};

export default AcademySettings;
