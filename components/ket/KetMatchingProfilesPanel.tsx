import type { KetMatchingPerson } from '@/lib/ketMatchingTypes';

interface KetMatchingProfilesPanelProps {
  topicTitle: string;
  topicSubtitle: string;
  profiles: KetMatchingPerson[];
}

function AvatarPlaceholder({ initials, name }: { initials: string; name: string }): JSX.Element {
  return (
    <div
      className="flex h-24 w-20 items-center justify-center rounded-sm border border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200 text-2xl font-bold text-slate-500"
      aria-label={`${name} 头像`}
    >
      {initials}
    </div>
  );
}

function ProfileRow({ profile }: { profile: KetMatchingPerson }): JSX.Element {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-[100px_1fr]">
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <p className="text-base font-bold text-slate-900">{profile.name}</p>
        {profile.imageSrc ? (
          <img
            src={profile.imageSrc}
            alt={profile.name}
            className="h-24 w-20 rounded-sm border border-slate-300 object-cover grayscale"
          />
        ) : (
          <AvatarPlaceholder initials={profile.initials ?? profile.name.charAt(0)} name={profile.name} />
        )}
        <span className="text-xs font-semibold text-slate-500">选项 {profile.columnLetter}</span>
      </div>
      <p className="text-[15px] leading-relaxed text-slate-800">{profile.paragraph}</p>
    </div>
  );
}

export function KetMatchingProfilesPanel({
  topicTitle,
  topicSubtitle,
  profiles,
}: KetMatchingProfilesPanelProps): JSX.Element {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4 text-center">
        <h2 className="text-lg font-bold text-slate-900">{topicTitle}</h2>
        <p className="mt-1 text-sm italic text-slate-600">{topicSubtitle}</p>
      </div>
      <div className="divide-y divide-slate-200">
        {profiles.map((profile) => (
          <ProfileRow key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
}
