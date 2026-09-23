import "./StatCard.css";

function StatCard({ title, value }) {
  return (
    <div className="stat-card">

      <span className="stat-card__title">
        {title}
      </span>

      <strong className="stat-card__value">
        {value}
      </strong>

    </div>
  );
}

export default StatCard;