import React, { useState } from 'react';
import { LogOut, Settings, Camera } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import IconButton from '../common/IconButton';
import { userService } from '../../services/userService';

const UserProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      if (photoFile) {
        formData.append('profilePhoto', photoFile);
      }
      const updated = await userService.updateProfile(formData);
      updateUser(updated);
      setIsSettingsOpen(false);
      toast.success('Profile updated');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Could not update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex-shrink-0 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-line">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
          <Avatar
            src={user.profilePhoto}
            name={user.fullName}
            size="sm"
            isOnline={true}
            showStatus={true}
            ringClassName="border-ink-900"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-medium text-fg truncate">{user.fullName}</h3>
            <p className="text-[11px] text-fg-subtle flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Online
            </p>
          </div>

          <IconButton
            icon={Settings}
            label="Profile settings"
            size="sm"
            onClick={() => {
              setFullName(user.fullName);
              setPhotoPreview(null);
              setPhotoFile(null);
              setIsSettingsOpen(true);
            }}
          />
          <IconButton icon={LogOut} label="Log out" size="sm" variant="danger" tooltipAlign="end" onClick={logout} />
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Edit profile"
        description="Update how others see you."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4 py-1">
            <label htmlFor="profile-photo-input" className="relative group cursor-pointer rounded-full">
              <Avatar src={photoPreview || user.profilePhoto} name={fullName || user.fullName} size="xl" />
              <span className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <Camera className="w-5 h-5 text-white" />
              </span>
            </label>
            <div className="min-w-0">
              <label
                htmlFor="profile-photo-input"
                className="text-[13px] font-medium text-fg hover:text-accent-300 cursor-pointer transition-colors"
              >
                Change photo
              </label>
              <p className="text-xs text-fg-subtle mt-0.5">JPG or PNG, square works best</p>
            </div>
            <input
              id="profile-photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <Input
            label="Full name"
            id="profile-full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            required
          />

          <Input label="Email" id="profile-email" value={user.email} disabled />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default UserProfile;
