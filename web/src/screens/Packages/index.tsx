import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  message,
  Modal,
  Row,
  Spin,
  Tag,
  Typography
} from 'antd';
import { CheckOutlined, CrownOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useIsAuthenticated } from 'react-auth-kit';
import dayjs from 'dayjs';
import { checkoutPackage, getProgramPackages } from '../../api/package';
import { httpRequest } from '../../helpers/api';
import { getErrorMessage } from '../../helpers/errorMessage';
import {
  formatRupiah,
  PackageProps,
  ProgramPackagesProps
} from '../../types/package.type';
import { ProgramProps } from '../../types/program.type';
import './Packages.css';

const { Title, Text, Paragraph } = Typography;

/** Benefits of a package, in the order the business plan lists them. */
export function packageBenefits(pkg: PackageProps): string[] {
  const benefits: string[] = [];
  if (pkg.tryout_count > 0) {
    benefits.push(`${pkg.tryout_count} Tryout SKD mirip CAT BKN`);
  }
  benefits.push('Skor per subtes & ranking nasional');
  if (pkg.has_explanation) benefits.push('Pembahasan tertulis tiap soal');
  if (pkg.class_count > 0) benefits.push(`${pkg.class_count} kelas pembahasan live`);
  if (pkg.recording_days > 0) benefits.push(`Rekaman kelas ${pkg.recording_days} hari`);
  if (pkg.has_weekly_report) benefits.push('Email progres mingguan');
  if (pkg.has_study_group) benefits.push('Grup belajar');
  if (pkg.mentoring_sessions > 0) {
    benefits.push(`${pkg.mentoring_sessions} sesi mentoring 1:1`);
  }
  if (pkg.has_certificate) benefits.push('Sertifikat');
  return [...benefits, ...(pkg.features || [])];
}

const PackagesScreen = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const [data, setData] = useState<ProgramPackagesProps>();
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string>();

  useEffect(() => {
    if (!programId) return;
    setIsLoading(true);
    getProgramPackages(programId)
      .then(setData)
      .catch((err) => message.error(getErrorMessage(err, 'Paket tidak dapat dimuat')))
      .finally(() => setIsLoading(false));
  }, [programId]);

  const askToCompleteProfile = (text: string) => {
    Modal.confirm({
      title: 'Lengkapi profil dulu',
      content: text,
      okText: 'Buka Profil',
      cancelText: 'Nanti',
      onOk: () => navigate('/profile')
    });
  };

  const startCheckout = async (pkg: PackageProps) => {
    try {
      setProcessingId(pkg.package_id);
      const order = await checkoutPackage(pkg.package_id);
      if (order.status === 'PAID') {
        message.success(`Paket ${pkg.name} aktif. Selamat berlatih!`);
        navigate('/tryout');
        return;
      }
      if (order.payment_url) {
        // Midtrans payment page; Midtrans returns to /pesanan/:number afterwards.
        window.location.assign(order.payment_url);
        return;
      }
      navigate(`/pesanan/${order.order_number}`);
    } catch (err) {
      const text = getErrorMessage(err, 'Pesanan tidak dapat dibuat');
      if (/whatsapp/i.test(text)) {
        askToCompleteProfile(text);
      } else {
        message.error(text);
      }
    } finally {
      setProcessingId(undefined);
    }
  };

  const onChoose = (pkg: PackageProps) => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: location } });
      return;
    }
    Modal.confirm({
      title: pkg.is_free ? `Ambil paket ${pkg.name}?` : `Beli paket ${pkg.name}?`,
      content: pkg.is_free
        ? 'Paket gratis hanya bisa diambil satu kali per nomor WhatsApp.'
        : `Total pembayaran ${formatRupiah(pkg.current_price)}. Anda akan diarahkan ke halaman pembayaran.`,
      okText: pkg.is_free ? 'Ambil Gratis' : 'Lanjut Bayar',
      cancelText: 'Batal',
      onOk: () => startCheckout(pkg)
    });
  };

  const buttonFor = (pkg: PackageProps) => {
    const loggedIn = isAuthenticated();
    if (pkg.is_owned) return { label: 'Paket Anda', disabled: true };
    if (!data?.is_registration_open) return { label: 'Pendaftaran Ditutup', disabled: true };
    if (pkg.is_sold_out) return { label: 'Kuota Penuh', disabled: true };
    if (!loggedIn) {
      return { label: pkg.is_free ? 'Masuk & Coba Gratis' : 'Masuk untuk Membeli', disabled: false };
    }
    if (!pkg.can_purchase) return { label: 'Sudah Termasuk', disabled: true };
    if (pkg.is_free) return { label: 'Coba Gratis', disabled: false };
    return { label: pkg.is_upgrade ? 'Tingkatkan Paket' : 'Pilih Paket', disabled: false };
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <Empty description="Paket tidak ditemukan" />;
  }

  const launchUntil = data.packages.find((pkg) => pkg.is_launch_price)?.launch_price_until;

  return (
    <div className="packages-page">
      <div className="packages-header">
        <Title level={2} style={{ marginBottom: 4 }}>
          {data.program.name}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Pendaftaran {dayjs(data.program.open_registration).format('DD MMM YYYY')} –{' '}
          {dayjs(data.program.close_registration).format('DD MMM YYYY')}
        </Paragraph>
      </div>

      {launchUntil && (
        <Alert
          type="success"
          showIcon
          message={`Harga peluncuran berlaku sampai ${dayjs(launchUntil).format('DD MMM YYYY HH:mm')}`}
        />
      )}
      {!data.is_registration_open && (
        <Alert type="warning" showIcon message="Pendaftaran gelombang ini sedang ditutup." />
      )}

      <Row gutter={[16, 16]} align="stretch">
        {data.packages.map((pkg) => {
          const button = buttonFor(pkg);
          const highlighted = Boolean(pkg.badge);
          return (
            <Col key={pkg.package_id} xs={24} sm={12} lg={8}>
              <Card
                className={`package-card${highlighted ? ' is-highlighted' : ''}${pkg.is_owned ? ' is-owned' : ''}`}
                bordered
              >
                <div className="package-card-top">
                  <Title level={4} style={{ margin: 0 }}>
                    {pkg.name}
                  </Title>
                  {pkg.is_owned ? (
                    <Tag color="green">Aktif</Tag>
                  ) : highlighted ? (
                    <Tag color="gold" icon={<CrownOutlined />}>
                      {pkg.badge}
                    </Tag>
                  ) : null}
                </div>

                <div className="package-price">
                  {pkg.is_free ? (
                    <span className="package-price-value">Gratis</span>
                  ) : (
                    <>
                      {pkg.normal_value > pkg.current_price && (
                        <Text delete type="secondary">
                          {formatRupiah(pkg.normal_value)}
                        </Text>
                      )}
                      <span className="package-price-value">{formatRupiah(pkg.current_price)}</span>
                      {pkg.price_per_session > 0 && (
                        <Text type="secondary">
                          {formatRupiah(pkg.price_per_session)} per {pkg.class_count > 0 ? 'TO + kelas' : 'TO'}
                        </Text>
                      )}
                    </>
                  )}
                  {pkg.savings_percent > 0 && !pkg.is_free && (
                    <Tag color="red" style={{ marginTop: 6, width: 'fit-content' }}>
                      Hemat {pkg.savings_percent}%
                    </Tag>
                  )}
                </div>

                {pkg.description && <Paragraph type="secondary">{pkg.description}</Paragraph>}

                <ul className="package-benefits">
                  {packageBenefits(pkg).map((benefit) => (
                    <li key={benefit}>
                      <CheckOutlined /> <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {pkg.remaining_quota !== undefined && pkg.remaining_quota !== null && (
                  <Text type={pkg.is_sold_out ? 'danger' : 'warning'} className="package-quota">
                    {pkg.is_sold_out ? 'Kuota habis' : `Sisa ${pkg.remaining_quota} kursi`}
                  </Text>
                )}

                <Button
                  type={highlighted || pkg.is_free ? 'primary' : 'default'}
                  block
                  size="large"
                  disabled={button.disabled}
                  loading={processingId === pkg.package_id}
                  onClick={() => onChoose(pkg)}
                >
                  {button.label}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Paragraph type="secondary" style={{ fontSize: 12 }}>
        TELISIK tidak menjamin kelulusan seleksi CPNS. Hasil tryout adalah gambaran kesiapan Anda.
      </Paragraph>
    </div>
  );
};

/** /paket: opens the program whose registration is open (for links in ads). */
export const CurrentPackagesRedirect = () => {
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    httpRequest
      .get('/program')
      .then((res) => {
        const programs: ProgramProps[] = res.data?.payload?.results || res.data?.payload || [];
        const withPackages = programs.filter((program) => program.has_packages && program.is_published);
        const now = dayjs();
        const open = withPackages.find(
          (program) =>
            now.isAfter(dayjs(program.open_registration)) &&
            now.isBefore(dayjs(program.close_registration))
        );
        const target = open || withPackages[0];
        if (target) {
          navigate(`/program/${target.program_id}/paket`, { replace: true });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [navigate]);

  return notFound ? (
    <Empty description="Belum ada paket yang dibuka." />
  ) : (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <Spin size="large" />
    </div>
  );
};

export default PackagesScreen;
