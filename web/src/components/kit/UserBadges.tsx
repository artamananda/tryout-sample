import { Space, Tag, Tooltip } from 'antd';
import { CheckCircleFilled, CrownFilled, IdcardFilled } from '@ant-design/icons';
import type { UserBadges as UserBadgesData } from '../../types/badge.type';

/** Colour per paid package, from the entry package up to the top one. */
const PACKAGE_COLORS: Record<string, string> = {
  premium: 'blue',
  unggulan: 'purple',
  eksekutif: 'gold',
  platinum: '#334155'
};

/** The blue check alone, for tight places such as a header or a table cell. */
export const VerifiedMark = ({ badges, size = 15 }: { badges?: UserBadgesData; size?: number }) =>
  badges?.verified ? (
    <Tooltip title={`Terverifikasi · ${badges.verified.label_name || badges.verified.label}`}>
      <CheckCircleFilled
        aria-label="Terverifikasi"
        style={{ color: '#1d9bf0', fontSize: size, marginLeft: 4, verticalAlign: '-0.1em' }}
      />
    </Tooltip>
  ) : null;

type Props = {
  badges?: UserBadgesData;
  /** Hide the "Profil Lengkap" badge (e.g. in rankings). */
  hideProfile?: boolean;
  /** Smaller tags without the verified label text. */
  compact?: boolean;
};

/** Verified check, paid package and complete-profile badges of a user. */
const UserBadges = ({ badges, hideProfile, compact }: Props) => {
  if (!badges) return null;
  const items = [];

  if (badges.verified) {
    items.push(
      compact ? (
        <VerifiedMark key="verified" badges={badges} />
      ) : (
        <Tag key="verified" color="#1d9bf0" icon={<CheckCircleFilled />} style={{ marginInlineEnd: 0 }}>
          {badges.verified.label_name || 'Terverifikasi'}
        </Tag>
      )
    );
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
    <Space size={4} wrap style={{ verticalAlign: 'middle' }}>
      {items}
    </Space>
  );
};

export default UserBadges;
