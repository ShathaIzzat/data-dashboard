import "./Header.css";

function Header() {
  return (
    <header className="header">

      {/* خلفية وإضاءة الهيدر */}
      <div className="header__glow header__glow--one"></div>
      <div className="header__glow header__glow--two"></div>

      <div className="header__content">

        <div className="header__brand">

          {/* الشعار */}
          <div className="header__logo-wrapper">
            <img
              src="/logo.png"
              alt="شعار جمعية أصدقاء بلا حدود"
              className="header__logo"
            />
          </div>

          {/* معلومات النظام */}
          <div className="header__info">

            <div className="header__organization">
              جمعية أصدقاء بلا حدود
            </div>

            <div className="header__title-row">

              <span className="header__accent"></span>

              <h1>
                نظام البحث بالكشوفات
              </h1>

            </div>

            <p>
              البحث وإدارة بيانات المستفيدين
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Header;