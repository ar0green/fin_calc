# Finance Calculator Backend MVP

Backend для MVP приложения личных финансов.

Стек:

- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Alembic
- Pydantic v2
- JWT Auth

---

## 1. Подготовка окружения

Скопировать `.env.example` в `.env`:

```bash
cp .env.example .env
```

---

## 2. Поднять PostgreSQL

```bash
docker compose up -d
```

---

## 3. Установить зависимости

Рекомендуется использовать virtualenv.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Для Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 4. Применить миграции

```bash
alembic upgrade head
```

---

## 5. Заполнить демо-данные

```bash
python -m scripts.seed_demo_data
```

Скрипт создаст пользователя из `.env` и демо-данные:

- incomes
- expenses
- debts

По умолчанию:

```text
email: admin@example.com
password: admin123
```

---

## 6. Запустить backend

```bash
uvicorn app.main:app --reload
```

Backend будет доступен:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

Healthcheck:

```text
http://localhost:8000/health
```

---

## 7. Авторизация

Endpoint:

```http
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Ответ:

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

Дальше передавай токен:

```http
Authorization: Bearer <access_token>
```

---

## 8. Основные API

### Auth

```http
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

### Incomes

```http
GET    /api/v1/incomes
POST   /api/v1/incomes
GET    /api/v1/incomes/{income_id}
PUT    /api/v1/incomes/{income_id}
DELETE /api/v1/incomes/{income_id}
```

### Expenses

```http
GET    /api/v1/expenses
POST   /api/v1/expenses
GET    /api/v1/expenses/{expense_id}
PUT    /api/v1/expenses/{expense_id}
DELETE /api/v1/expenses/{expense_id}
```

### Debts

```http
GET    /api/v1/debts
POST   /api/v1/debts
GET    /api/v1/debts/{debt_id}
PUT    /api/v1/debts/{debt_id}
DELETE /api/v1/debts/{debt_id}
```

### Calculations

```http
GET  /api/v1/calculations/summary
GET  /api/v1/calculations/cashflow
POST /api/v1/calculations/debt-strategy
POST /api/v1/calculations/scenario-compare
```

### Analytics

```http
GET /api/v1/analytics/overview
GET /api/v1/analytics/income-expense-by-month
GET /api/v1/analytics/expense-structure
GET /api/v1/analytics/debt-dynamics
```

---

## 9. CORS

Для frontend на Vite используется origin:

```text
http://localhost:5173
```

Настраивается через `.env`:

```env
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## 10. Полезные Alembic команды

Создать новую миграцию:

```bash
alembic revision --autogenerate -m "migration name"
```

Применить миграции:

```bash
alembic upgrade head
```

Откатить последнюю миграцию:

```bash
alembic downgrade -1
```

---

## 11. Быстрая проверка backend

Последовательность:

```bash
docker compose up -d
alembic upgrade head
python -m scripts.seed_demo_data
uvicorn app.main:app --reload
```

Затем открыть:

```text
http://localhost:8000/docs
```

И проверить:

1. `POST /api/v1/auth/login`
2. `GET /api/v1/analytics/overview`
3. `POST /api/v1/calculations/scenario-compare`

---

## 12. Примечание по демо-данным

`seed_demo_data.py` очищает финансовые данные пользователя из `.env` и создаёт их заново.

Он удаляет только:

- incomes
- expenses
- debts

Пользователя не удаляет.