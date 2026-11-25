import { Space, Tag, Tooltip } from 'antd';
import { CrownFilled, IdcardFilled } from '@ant-design/icons';
import type { UserBadges as UserBadgesData } from '../../types/badge.type';

/** Colour per paid package, from the entry package up to the top one. */
export const PACKAGE_COLORS: Record<string, string> = {
  premium: 'blue',
  unggulan: 'purple',
  eksekutif: 'gold',
  platinum: '#334155'
};

const VERIFIED_COLOR = '#1d9bf0';

/** Scalloped seal (12 lobes) with a check mark, drawn for TELISIK. */
const VerifiedSeal = ({ size }: { size: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    role="img"
    aria-label="Terverifikasi"
    style={{ display: 'block', flex: 'none' }}
  >
    <path
      fill={VERIFIED_COLOR}
      d="M12 2.4Q15.4 -0.68 16.8 3.69Q21.28 2.72 20.31 7.2Q24.68 8.6 21.6 12Q24.68 15.4 20.31 16.8Q21.28 21.28 16.8 20.31Q15.4 24.68 12 21.6Q8.6 24.68 7.2 20.31Q2.72 21.28 3.69 16.8Q-0.68 15.4 2.4 12Q-0.68 8.6 3.69 7.2Q2.72 2.72 7.2 3.69Q8.6 -0.68 12 2.4Z"
    />
    <path
      d="M7.6 12.2l2.9 2.9 5.9-6.1"
      fill="none"
      stroke="#fff"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The blue check. Why the user is verified (owner, tutor, ...) only shows on
 * hover, like on Instagram or X.
 */
export const VerifiedMark = ({ badges, size = 16 }: { badges?: UserBadgesData; size?: number }) =>
  badges?.verified ? (
    <Tooltip title={`Terverifikasi · ${badges.verified.label_name || badges.verified.label}`}>
      <span className="tl-verified-mark">
        <VerifiedSeal size={size} />
      </span>
    </Tooltip>
  ) : null;

type Props = {
  badges?: UserBadgesData;
  /** Hide the blue check (when it is already shown next to the name). */
  hideVerified?: boolean;
  /** Hide the "Profil Lengkap" badge (e.g. in rankings). */
  hideProfile?: boolean;
  /** Shorter labels for tight places. */
  compact?: boolean;
};

/** Blue check, paid package and complete-profile badges of a user. */
const UserBadges = ({ badges, hideVerified, hideProfile, compact }: Props) => {
  if (!badges) return null;
  const items = [];

  if (badges.verified && !hideVerified) {
    items.push(<VerifiedMark key="verified" badges={badges} size={18} />);
  }
  if (badges.package) {
    items.push(
      <Tooltip key="package" title={`Peserta paket ${badges.package.name}`}>
        <Tag
          color={PACKAGE_COLORS[badges.package.code] || 'blue'}
          icon={<CrownFilled />}
          style={{ marginInlineEnd: 0 }}
        >
          {badges.package.name}
        </Tag>
      </Tooltip>
    );
  }
  if (badges.profile_complete && !hideProfile) {
    items.push(
      <Tooltip key="profile" title="Data profil sudah lengkap">
        <Tag color="green" icon={<IdcardFilled />} style={{ marginInlineEnd: 0 }}>
          {compact ? 'Lengkap' : 'Profil Lengkap'}
        </Tag>
      </Tooltip>
    );
  }

  if (items.length === 0) return null;
  return (
    <Space size={6} wrap style={{ verticalAlign: 'middle' }}>
      {items}
    </Space>
  );
};

export default UserBadges;
