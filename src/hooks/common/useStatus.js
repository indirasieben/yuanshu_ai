/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import { useEffect, useState } from 'react';

export const readStatus = () => {
  try {
    const statusData = localStorage.getItem('status');
    if (!statusData) return {};
    return JSON.parse(statusData) || {};
  } catch {
    return {};
  }
};

/**
 * 读取并同步 localStorage.status
 * - 监听 storage 事件（跨标签页/窗口）
 * - 同标签页内写 localStorage 不触发 storage，这里做短暂轮询兜底
 */
export const useStatus = ({
  pollIntervalMs = 500,
  pollDurationMs = 8000,
} = {}) => {
  const [status, setStatus] = useState(() => readStatus());

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (cancelled) return;
      setStatus(readStatus());
    };

    refresh();
    const interval = window.setInterval(refresh, pollIntervalMs);
    const timeout = window.setTimeout(
      () => window.clearInterval(interval),
      pollDurationMs,
    );

    const onStorage = (e) => {
      if (e?.key === 'status') refresh();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      window.removeEventListener('storage', onStorage);
    };
  }, [pollDurationMs, pollIntervalMs]);

  return { status, getLatestStatus: readStatus };
};

