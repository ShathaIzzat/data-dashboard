import "./PersonCard.css";

function PersonCard({ person }) {
  return (
    <div className="person-card">

      <div className="person-card__header">
        <div>
          <h2>{person.husbandName}</h2>
          <p>بيانات المستفيد</p>
        </div>

        <span className="person-card__status">
          {person.status}
        </span>
      </div>

      <div className="person-card__body">

        <div className="person-card__section">

          <h3>بيانات الزوج</h3>

          <div className="person-card__grid">

            <div className="info-item">
              <span>الاسم</span>
              <strong>{person.husbandName}</strong>
            </div>

            <div className="info-item">
              <span>رقم الهوية</span>
              <strong>{person.husbandId}</strong>
            </div>

            <div className="info-item">
              <span>رقم الجوال</span>
              <strong>{person.phone}</strong>
            </div>

            <div className="info-item">
              <span>عدد أفراد الأسرة</span>
              <strong>{person.familyMembers}</strong>
            </div>

          </div>

        </div>


        <div className="person-card__section">

          <h3>بيانات الزوجة</h3>

          <div className="person-card__grid">

            <div className="info-item">
              <span>اسم الزوجة</span>
              <strong>{person.wifeName}</strong>
            </div>

            <div className="info-item">
              <span>رقم هوية الزوجة</span>
              <strong>{person.wifeId}</strong>
            </div>

          </div>

        </div>


        <div className="person-card__section">

          <h3>بيانات المنطقة</h3>

          <div className="person-card__grid">

            <div className="info-item">
              <span>المحافظة</span>
              <strong>{person.governorate}</strong>
            </div>

            <div className="info-item">
              <span>المنطقة</span>
              <strong>{person.area}</strong>
            </div>

            <div className="info-item">
              <span>التاريخ</span>
              <strong>{person.date}</strong>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default PersonCard;