import { FormEvent, useEffect, useState, ChangeEvent, type ReactNode } from "react";
import { X, User, Building, Mail, Briefcase, Camera } from "lucide-react";
import { UserProfile } from "../lib/profile";

interface ProfileEditModalProps {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
}

export default function ProfileEditModal({
  open,
  profile,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const [draft, setDraft] = useState<UserProfile>(profile);

  useEffect(() => {
    if (open) setDraft(profile);
  }, [open, profile]);

  if (!open) return null;

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDraft((d) => ({ ...d, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      company: draft.company.trim(),
      role: draft.role.trim(),
      email: draft.email.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-[#eee7de] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#eee7de]">
          <h3 className="text-sm font-bold text-[#2e2624]">Editar perfil</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#faf7f2] text-[#7d6f6b] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {draft.avatarUrl ? (
                <img
                  src={draft.avatarUrl}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold">
                  {draft.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 p-1.5 bg-white border border-[#eee7de] rounded-full cursor-pointer shadow-sm hover:border-brand">
                <Camera size={14} className="text-brand" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
            <p className="text-[10px] text-[#7d6f6b]">Foto de perfil (opcional)</p>
          </div>

          <Field
            icon={<User size={14} />}
            label="Nome"
            value={draft.name}
            onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
            required
          />
          <Field
            icon={<Building size={14} />}
            label="Empresa"
            value={draft.company}
            onChange={(v) => setDraft((d) => ({ ...d, company: v }))}
          />
          <Field
            icon={<Briefcase size={14} />}
            label="Cargo"
            value={draft.role}
            onChange={(v) => setDraft((d) => ({ ...d, role: v }))}
          />
          <Field
            icon={<Mail size={14} />}
            label="E-mail"
            type="email"
            value={draft.email}
            onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
          />

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#eee7de] text-xs font-bold text-[#7d6f6b] hover:bg-[#faf7f2] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:opacity-90 cursor-pointer"
            >
              Salvar perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wide text-[#7d6f6b] flex items-center gap-1">
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-xl border border-[#e5dec9]/80 bg-[#faf7f2] text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}
