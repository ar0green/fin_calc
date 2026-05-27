# Finance Calculator MVP

Веб-приложение для личных финансов:

- доходы
- расходы
- долги
- dashboard
- аналитика
- стратегии погашения долгов
- сравнение сценариев

Стек:

- Backend: FastAPI, SQLAlchemy, PostgreSQL, Alembic
- Frontend: React, TypeScript, Vite, Tailwind, TanStack Query, Recharts
- Infra: Docker Compose, Nginx

---

## 1. Быстрый старт через Docker

Из корня проекта:

```bash
cp .env.example .env
docker compose up --build -d
```

Или через Makefile:

```bash
make init
make up-build
```

После запуска:

```text
Frontend: http://localhost:8090
Backend:  http://localhost:8000
Swagger:  http://localhost:8000/docs
```

---

## 2. Демо-данные

Seed запускается отдельно, чтобы не перетирать данные при каждом старте.

```bash
docker compose --profile seed run --rm seed
```

Или:

```bash
make seed
```

Демо-пользователь:

```text
email: admin@example.com
password: admin123
```

---

## 3. Полный запуск с нуля

```bash
make init
make up-build
make seed
```

Открыть:

```text
http://localhost:8090
```

---

## 4. Сброс базы данных

Внимание: команда удалит volume PostgreSQL и все данные.

```bash
make reset-db
```

Ручной вариант:

```bash
docker compose down -v
docker compose up --build -d postgres
docker compose --profile seed run --rm seed
docker compose up --build -d
```

---

## 5. Основные команды Makefile

```bash
make help
make up
make up-build
make down
make restart
make logs
make logs-backend
make logs-frontend
make ps
make seed
make migrate
make reset-db
make backend-shell
make frontend-shell
make smoke
```

---

## 6. Порты

По умолчанию:

```text
PostgreSQL: 5432
Backend:    8000
Frontend:   8090
```

Настраивается в `.env`:

```env
BACKEND_PORT=8000
FRONTEND_PORT=8090
```

Если порт занят, например `8090`, можно заменить:

```env
FRONTEND_PORT=30080
```

Потом:

```bash
docker compose up --build -d
```

---

## 7. Localhost vs IP сервера

Если Docker запущен на удалённом сервере, а frontend открывается с другого компьютера, нельзя использовать:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Потому что `localhost` в браузере означает компьютер пользователя, а не сервер.

Нужно указать IP или домен сервера:

```env
VITE_API_BASE_URL=http://192.168.1.50:8000/api/v1
BACKEND_CORS_ORIGINS=http://192.168.1.50:8090,http://localhost:5173,http://127.0.0.1:5173
```

После изменения `VITE_API_BASE_URL` нужно пересобрать frontend:

```bash
docker compose build frontend
docker compose up -d frontend
```

---

## 8. CORS

Backend разрешает frontend origins из переменной:

```env
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8090,http://127.0.0.1:8090
```

Если открываешь frontend по IP сервера:

```text
http://192.168.1.50:8090
```

добавь этот origin:

```env
BACKEND_CORS_ORIGINS=http://192.168.1.50:8090,http://localhost:5173,http://127.0.0.1:5173
```

После изменения `.env` перезапусти backend:

```bash
docker compose up -d --force-recreate backend
```

---

## 9. Проверка backend

```bash
curl http://localhost:8000/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

Swagger:

```text
http://localhost:8000/docs
```

---

## 10. Проверка frontend

Открыть:

```text
http://localhost:8090
```

Проверить:

1. Login
2. Dashboard
3. Incomes
4. Expenses
5. Debts
6. Scenarios
7. Analytics

---

## 11. Smoke checklist

После запуска и seed:

### Auth

- открыть frontend
- залогиниться `admin@example.com / admin123`
- проверить logout

### Dashboard

- проверить карточки метрик
- проверить графики
- поменять период

### Incomes

- создать доход
- отредактировать доход
- удалить доход

### Expenses

- создать расход
- отредактировать расход
- удалить расход

### Debts

- создать долг
- отредактировать долг
- удалить долг

### Scenarios

- открыть страницу сценариев
- изменить extra payment
- запустить расчёт
- проверить сравнение стратегий

### Analytics

- открыть аналитику
- поменять период
- проверить графики и структуру расходов

---

## 12. Локальный backend без Docker

Из папки `backend`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m alembic upgrade head
python -m scripts.seed_demo_data
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

---

## 13. Локальный frontend без Docker

Из папки `frontend`:

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 14. Важное про Vite env

Переменная:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

вшивается в frontend на этапе сборки.

Если поменял `VITE_API_BASE_URL`, нужно пересобрать frontend:

```bash
docker compose build frontend
docker compose up -d frontend
```

---

## 15. Troubleshooting

### Frontend не открывается

Проверь:

```bash
docker compose ps
curl -I http://localhost:8090
docker compose logs frontend --tail=100
```

Если порт занят, поменяй:

```env
FRONTEND_PORT=30080
```

---

### Backend не открывается

Проверь:

```bash
docker compose logs backend --tail=100
curl http://localhost:8000/health
```

---

### CORS error

Проверь, каким URL открыт frontend.

Если:

```text
http://192.168.1.50:8090
```

то в `.env` должен быть:

```env
BACKEND_CORS_ORIGINS=http://192.168.1.50:8090
```

Потом пересоздай backend:

```bash
docker compose up -d --force-recreate backend
```

---

### Frontend ходит на localhost вместо IP сервера

Проверь `.env`:

```env
VITE_API_BASE_URL=http://192.168.1.50:8000/api/v1
```

Потом пересобери frontend:

```bash
docker compose build frontend
docker compose up -d frontend
```

---

### Seed не применился

Запусти:

```bash
make seed
```

Или:

```bash
docker compose --profile seed run --rm seed
```

---

## 16. Текущий статус MVP

Реализовано:

- JWT login
- Dashboard
- Incomes CRUD
- Expenses CRUD
- Debts CRUD
- Analytics
- Scenario comparison
- Debt strategy projection
- Docker Compose setup
- Demo seed data