import { Link } from 'react-router-dom';

export default function Logo({ to = null, height = 40 }) {
  const img = <img src="/logo.png" alt="VouchMetrics" style={{ height }} className="object-contain" />;
  if (!to) return img;
  return <Link to={to}>{img}</Link>;
}
