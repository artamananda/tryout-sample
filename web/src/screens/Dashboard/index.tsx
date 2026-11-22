import ListTryout from '../../components/Dashboard/ListTryout';
import PageHeader from '../../components/kit/PageHeader';

/** Tryout list (route /tryout). */
const DashboardScreen = () => (
  <div className="tl-page">
    <PageHeader title="Tryout" subtitle="Pilih tryout yang sedang dibuka, masukkan token, lalu mulai kerjakan." />
    <ListTryout />
  </div>
);

export default DashboardScreen;
