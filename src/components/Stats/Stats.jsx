import { useMemo } from "react";
import "./Stats.css";

import {
  getRecordStatus,
} from "../../utils/statusUtils";

function Stats({ data = [] }) {
  const stats = useMemo(() => {
    let beneficiaries = 0;
    let nonBeneficiaries = 0;

    data.forEach((record) => {
      const status = getRecordStatus(record);

      if (status === "beneficiary") {
        beneficiaries++;
      }

      if (status === "non-beneficiary") {
        nonBeneficiaries++;
      }
    });

    const sheets = new Set(
      data
        .map(
          (record) =>
            `${record.sourceFile || ""}|||${record.sheetName || ""}`
        )
        .filter((value) => value !== "|||")
    ).size;

    return {
      total: data.length,
      beneficiaries,
      nonBeneficiaries,
      sheets,
    };
  }, [data]);

  return (
    <section className="stats">

      <div className="stat-card stat-card--total">
        <div className="stat-card__content">
          <span className="stat-card__title">
            إجمالي السجلات
          </span>

          <strong className="stat-card__value">
            {stats.total}
          </strong>
        </div>

        <div className="stat-card__icon">
          📊
        </div>
      </div>


      <div className="stat-card stat-card--beneficiary">
        <div className="stat-card__content">
          <span className="stat-card__title">
            المستفيدون
          </span>

          <strong className="stat-card__value">
            {stats.beneficiaries}
          </strong>
        </div>

        <div className="stat-card__icon">
          ✓
        </div>
      </div>


      <div className="stat-card stat-card--non-beneficiary">
        <div className="stat-card__content">
          <span className="stat-card__title">
            غير المستفيدين
          </span>

          <strong className="stat-card__value">
            {stats.nonBeneficiaries}
          </strong>
        </div>

        <div className="stat-card__icon">
          ✕
        </div>
      </div>


      <div className="stat-card stat-card--sheets">
        <div className="stat-card__content">
          <span className="stat-card__title">
            عدد الكشوفات
          </span>

          <strong className="stat-card__value">
            {stats.sheets}
          </strong>
        </div>

        <div className="stat-card__icon">
          📁
        </div>
      </div>

    </section>
  );
}

export default Stats;