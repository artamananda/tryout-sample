import { useEffect, useState } from 'react';

export type ProvinceOption = { id: string; name: string };
export type RegencyOption = { id: string; province_id: string; name: string };

const REGION_API = 'https://www.emsifa.com/api-wilayah-indonesia/api';

/** Loads Indonesian provinces, and the regencies of the selected province. */
export default function useIndonesiaRegions(selectedProvince?: string) {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [regencies, setRegencies] = useState<RegencyOption[]>([]);

  useEffect(() => {
    fetch(`${REGION_API}/provinces.json`)
      .then((response) => response.json())
      .then((data: ProvinceOption[]) => setProvinces(data))
      .catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    const province = provinces.find((item) => item.name === selectedProvince);
    if (!province) {
      setRegencies([]);
      return;
    }
    fetch(`${REGION_API}/regencies/${province.id}.json`)
      .then((response) => response.json())
      .then((data: RegencyOption[]) => setRegencies(data))
      .catch(() => setRegencies([]));
  }, [selectedProvince, provinces]);

  return { provinces, regencies };
}
