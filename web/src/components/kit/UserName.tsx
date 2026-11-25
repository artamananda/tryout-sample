import { useEffect, useReducer } from 'react';
import { Tag, Tooltip } from 'antd';
import { CrownFilled } from '@ant-design/icons';
import { httpRequest } from '../../helpers/api';
import type { UserBadges } from '../../types/badge.type';
import { PACKAGE_COLORS, VerifiedMark } from './UserBadges';

/*
 * Badges for lists of names. Screens render <UserName userId name />; the
 * badges of every name on the page are fetched in one request and cached.
 */
const cache = new Map<string, UserBadges | null>();
const queued = new Set<string>();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

const flush = async () => {
  timer = undefined;
  const ids = [...queued];
  queued.clear();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    try {
      const res = await httpRequest.get('/user-badges', { params: { ids: chunk.join(',') } });
      const payload: Record<string, UserBadges> = res.data?.payload || {};
      chunk.forEach((id) => cache.set(id, payload[id] || null));
    } catch {
      chunk.forEach((id) => cache.set(id, null));
    }
  }
  listeners.forEach((notify) => notify());
};

const request = (ids: string[]) => {
  ids.forEach((id) => {
    if (id && !cache.has(id)) queued.add(id);
  });
  if (queued.size && !timer) timer = setTimeout(flush, 20);
};

/** Forget cached badges, e.g. after an admin changes a user's blue check. */
export const forgetUserBadges = (userId?: string) => (userId ? cache.delete(userId) : cache.clear());

/** Returns a lookup of badges for the given users, fetching any not cached. */
export const useUserBadges = (userIds: (string | undefined)[]) => {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const key = userIds.filter(Boolean).join(',');
  useEffect(() => {
    listeners.add(rerender);
    request(key ? key.split(',') : []);
    return () => {
      listeners.delete(rerender);
    };
  }, [key]);
  return (userId?: string) => (userId ? cache.get(userId) || undefined : undefined);
};

type Props = {
  userId?: string;
  name: string;
  /** Badges already sent by the API; skips the lookup. */
  badges?: UserBadges;
  /** Show the paid-package tag after the name (default true). */
  showPackage?: boolean;
  strong?: boolean;
  className?: string;
};

/**
 * A person's name with their blue check and package, vertically centred on
 * one line. A long name gets "..." so the badges always stay visible.
 */
const UserName = ({ userId, name, badges, showPackage = true, strong = true, className }: Props) => {
  const lookup = useUserBadges(badges ? [] : [userId]);
  const data = badges || lookup(userId);
  return (
    <span className={'tl-user-name' + (strong ? ' is-strong' : '') + (className ? ' ' + className : '')}>
      <span className="tl-user-name-text" title={name}>
        {name || '-'}
      </span>
      <VerifiedMark badges={data} />
      {showPackage && data?.package && (
        <Tooltip title={`Peserta paket ${data.package.name}`}>
          <Tag className="tl-user-name-tag" color={PACKAGE_COLORS[data.package.code] || 'blue'} icon={<CrownFilled />}>
            {data.package.name}
          </Tag>
        </Tooltip>
      )}
    </span>
  );
};

export default UserName;
