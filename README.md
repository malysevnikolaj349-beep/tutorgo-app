ТЗ АТТЕСТАТ БЕЗ РЕМНЯ

---

1. Полная очистка и инициализация репозитория (Foundation)

1.1 Цель
Подготовить GitHub-репозиторий к разработке новой версии продукта: полностью удалить артефакты старого проекта Eldoria, создать чёткую файловую структуру для backend и frontend, настроить базовую конфигурацию сборки и запуска, чтобы автоматизированные агенты (например, Jules) могли однозначно выполнить дальнейшие шаги.

1.2 Требования к очистке
1. Удалить все файлы и каталоги, относящиеся к Eldoria, включая скрытые и временные файлы, за исключением:
   - .git/
   - .gitignore
   - .github/ (если используется CI и нужно сохранить workflow)
   - README.md (по согласованию — можно очистить содержимое)
2. Проверить и удалить любые упоминания "Eldoria" в корневых файлах, конфигурациях, скриптах и документации.
3. Сделать коммит с сообщением: chore: remove legacy Eldoria project files и запушить в основную ветку.

1.3 Новая структура репозитория
Создать следующую структуру каталогов и файлов (минимум):

`
/server
  /controllers
  /models
  /routes
  /middleware
  index.js
  package.json
/src
  /components
    /ui
  /features
  /pages
vite.config.js
package.json
.gitignore
README.md
`

Дополнительно рекомендовано создать каталоги:
- /infra — инфраструктурные скрипты (docker, k8s, terraform)
- /scripts — утилиты для разработчиков (seed, migrate)
- /docs — документация проекта

1.4 Настройка vite.config.js
Файл vite.config.js должен содержать конфигурацию с алиасами:

`js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
      '@components': path.resolve(dirname, 'src/components'),
      '@ui': path.resolve(dirname, 'src/components/ui'),
      '@features': path.resolve(dirname, 'src/features'),
      '@pages': path.resolve(dirname, 'src/pages'),
    },
  },
})
`

Убедиться, что TypeScript/ESLint/IDE настроены на распознавание алиасов.

1.5 Настройка server/index.js (Express)
Файл server/index.js должен реализовывать минимальный каркас сервера:

- Подключение зависимостей: express, cors, helmet, morgan, path.
- Middleware: cors(), express.json(), express.urlencoded({ extended: true }), логирование запросов.
- Подключение маршрутов из server/routes.
- Обслуживание статики (при наличии сборки фронтенда в dist).
- Централизованный обработчик ошибок.
- Обработчик 404.
- Запуск сервера на process.env.PORT || 3000.

Пример каркаса:

`js
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))

// Подключение маршрутов
// const apiRoutes = require('./routes')
// app.use('/api', apiRoutes)

// Статика
// app.use(express.static(path.join(dirname, '..', 'dist')))
// app.get('*', (req, res) => res.sendFile(path.join(dirname, '..', 'dist', 'index.html')))

// 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: true, message: err.message || 'Internal Server Error' })
})

app.listen(PORT, () => console.log(Server running on port ${PORT}))
`

1.6 Скрипты package.json
В корне и в server/ добавить скрипты:

- dev — запуск в режиме разработки (nodemon / concurrently с фронтендом)
- start — запуск production
- build — сборка фронтенда
- lint, test, migrate, seed

Пример (корень):

`json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix src\"",
    "build": "npm run build --prefix src",
    "start": "node server/index.js"
  }
}
`

1.7 Контроль версий и ветвления
- Основная ветка: main (или master по соглашению).
- Рабочие ветки: feature/, bugfix/, hotfix/*.
- Pull Request с обязательными проверками: линтер, unit-тесты, сборка.

---

2. Проектирование Архитектуры Базы Данных (Detailed Schema)

2.1 Цель
Спроектировать реляционную схему (PostgreSQL) с учётом всех функциональных модулей: пользователи, профили, группы, расписание, домашние задания, теоретические материалы, геймификация, финансы, чат, видеосвязь, кастомизация UI, логи и конфигурации.

2.2 Общие принципы проектирования
- Нормализация данных до 3NF, где это оправдано.
- Использование UUID для PK (uuidgeneratev4()).
- Временные метки: createdat, updatedat, deleted_at (soft delete).
- JSONB для гибких полей (например, attachments, settings, criteria).
- Индексы по часто фильтруемым полям (email, role, status, foreign keys).
- Ограничения целостности (FK, CHECK).
- Транзакции для критичных операций (платежи, начисления очков).

2.3 Сущности и поля (полная спецификация)

2.3.1 Таблица users
- id UUID PK
- email VARCHAR UNIQUE NOT NULL
- phone VARCHAR UNIQUE
- password_hash VARCHAR NOT NULL
- role VARCHAR NOT NULL — enum: admin, tutor, student, parent
- status VARCHAR — enum: active, blocked, pending
- locale VARCHAR — язык интерфейса
- created_at TIMESTAMP
- updated_at TIMESTAMP
- last_login TIMESTAMP

Индексы: email, phone, role.

2.3.2 Таблицы профилей

tutors
- user_id UUID PK FK users(id)
- full_name VARCHAR
- bio TEXT
- avatar_url VARCHAR
- experience_years INT
- rate_hour NUMERIC
- subjects JSONB — список subject_id и уровней
- availability JSONB — шаблоны доступности
- notification_settings JSONB
- createdat, updatedat

students
- user_id UUID PK FK users(id)
- full_name VARCHAR
- birth_date DATE
- grade VARCHAR
- level VARCHAR
- avatar_url VARCHAR
- gamification_settings JSONB
- createdat, updatedat

parents
- user_id UUID PK FK users(id)
- full_name VARCHAR
- contact_phone VARCHAR
- createdat, updatedat

2.3.3 Связи между ролями

parent_student
- id UUID PK
- parent_id UUID FK users(id)
- student_id UUID FK users(id)
- status VARCHAR — active, pending, revoked
- createdat, updatedat

tutor_student
- id UUID PK
- tutor_id UUID FK users(id)
- student_id UUID FK users(id)
- status VARCHAR — active, inactive
- relationship_meta JSONB — договорённости, заметки
- createdat, updatedat

2.3.4 Subjects
- id UUID PK
- code VARCHAR UNIQUE
- name VARCHAR
- description TEXT
- createdat, updatedat

2.3.5 Groups
- id UUID PK
- tutor_id UUID FK users(id)
- subject_id UUID FK subjects(id)
- name VARCHAR
- description TEXT
- max_students INT
- status VARCHAR — active, archived, paused
- createdat, updatedat

group_students
- id UUID PK
- group_id UUID FK groups(id)
- student_id UUID FK users(id)
- joined_at TIMESTAMP
- left_at TIMESTAMP NULLABLE
- status VARCHAR — active, left, banned

2.3.6 Расписание

lesson_templates
- id UUID PK
- tutor_id UUID FK users(id)
- group_id UUID FK groups(id) NULLABLE
- student_id UUID FK users(id) NULLABLE — для индивидуальных
- weekday INT — 0..6
- start_time TIME
- end_time TIME
- repeat_rule JSONB — rrule или cron-like
- timezone VARCHAR
- createdat, updatedat

lesson_instances
- id UUID PK
- templateid UUID FK lessontemplates(id) NULLABLE
- tutor_id UUID FK users(id)
- group_id UUID FK groups(id) NULLABLE
- date DATE
- start_time TIMESTAMP
- end_time TIMESTAMP
- status VARCHAR — scheduled, completed, cancelled, no_show
- videoroomid UUID FK video_rooms(id) NULLABLE
- notes TEXT
- createdat, updatedat

attendance
- id UUID PK
- lessonid UUID FK lessoninstances(id)
- student_id UUID FK users(id)
- status VARCHAR — present, absent, late, excused
- note TEXT
- marked_by UUID FK users(id) — кто отметил
- marked_at TIMESTAMP

2.3.7 Домашние задания и теория

homework
- id UUID PK
- tutor_id UUID FK users(id)
- group_id UUID FK groups(id) NULLABLE
- title VARCHAR
- description TEXT
- attachments JSONB — [{name, url, mime, size}]
- due_date TIMESTAMP
- visibility JSONB — {type: 'group'|'students'|'all', student_ids: []}
- points INT — очки за выполнение
- createdat, updatedat

homework_assigns
- id UUID PK
- homework_id UUID FK homework(id)
- student_id UUID FK users(id)
- status VARCHAR — assigned, submitted, graded, overdue
- assigned_at TIMESTAMP
- due_date TIMESTAMP — per student override

homework_submissions
- id UUID PK
- homeworkassignid UUID FK homework_assigns(id)
- student_id UUID FK users(id)
- submitted_at TIMESTAMP
- answer_text TEXT
- attachments JSONB
- status VARCHAR — on_review, graded
- score NUMERIC
- tutor_comment TEXT
- graded_at TIMESTAMP

theory_materials
- id UUID PK
- tutor_id UUID FK users(id)
- title VARCHAR
- description TEXT
- attachments JSONB
- tags TEXT[]
- visibility JSONB — similar to homework
- createdat, updatedat

theory_access
- id UUID PK
- materialid UUID FK theorymaterials(id)
- student_id UUID FK users(id) NULLABLE
- group_id UUID FK groups(id) NULLABLE
- access_level VARCHAR — view, download
- granted_at TIMESTAMP

2.3.8 Геймификация

achievements
- id UUID PK
- code VARCHAR UNIQUE
- name VARCHAR
- description TEXT
- icon_url VARCHAR
- criteria JSONB — правила получения
- createdat, updatedat

student_achievements
- id UUID PK
- student_id UUID FK users(id)
- achievement_id UUID FK achievements(id)
- earned_at TIMESTAMP

points_balance
- student_id UUID PK FK users(id)
- points_total INT
- points_spent INT
- updated_at TIMESTAMP

points_transactions
- id UUID PK
- student_id UUID FK users(id)
- amount INT
- reason VARCHAR — homework, attendance, game, manual
- meta JSONB
- created_at TIMESTAMP

game_sessions
- id UUID PK
- student_id UUID FK users(id)
- game_type VARCHAR — quiz, flashcards, match
- subject_id UUID FK subjects(id) NULLABLE
- started_at TIMESTAMP
- finished_at TIMESTAMP
- duration INT — seconds
- createdat, updatedat

game_results
- id UUID PK
- sessionid UUID FK gamesessions(id)
- score INT
- accuracy NUMERIC
- details JSONB

2.3.9 Финансы

tariffs
- id UUID PK
- tutor_id UUID FK users(id) NULLABLE — platform-level or tutor-specific
- name VARCHAR
- pricingmodel VARCHAR — perlesson, subscription
- price NUMERIC
- currency VARCHAR
- billingcycle VARCHAR — monthly, onetime
- createdat, updatedat

invoices
- id UUID PK
- invoice_number VARCHAR UNIQUE
- student_id UUID FK users(id) NULLABLE
- parent_id UUID FK users(id) NULLABLE
- tutor_id UUID FK users(id) NULLABLE
- period_start DATE
- period_end DATE
- amount NUMERIC
- currency VARCHAR
- status VARCHAR — issued, paid, overdue, cancelled
- due_date DATE
- metadata JSONB
- createdat, updatedat

payments
- id UUID PK
- invoice_id UUID FK invoices(id)
- provider VARCHAR — stripe, paypal, yookassa etc.
- transaction_id VARCHAR
- amount NUMERIC
- currency VARCHAR
- status VARCHAR — pending, succeeded, failed, refunded
- paid_at TIMESTAMP
- meta JSONB

tutor_payouts
- id UUID PK
- tutor_id UUID FK users(id)
- amount NUMERIC
- period_start DATE
- period_end DATE
- status VARCHAR — pending, paid
- paid_at TIMESTAMP
- meta JSONB

2.3.10 Чат

chat_threads
- id UUID PK
- type VARCHAR — private, group, system
- title VARCHAR
- related_entity JSONB — {type: 'group'|'lesson'|'homework', id: UUID}
- created_by UUID FK users(id)
- createdat, updatedat

chat_participants
- id UUID PK
- threadid UUID FK chatthreads(id)
- user_id UUID FK users(id)
- role VARCHAR — owner, member
- joined_at TIMESTAMP
- muted_until TIMESTAMP NULLABLE

chat_messages
- id UUID PK
- threadid UUID FK chatthreads(id)
- sender_id UUID FK users(id)
- content TEXT
- attachments JSONB
- is_system BOOLEAN
- created_at TIMESTAMP
- edited_at TIMESTAMP NULLABLE
- deleted_at TIMESTAMP NULLABLE

message_statuses
- id UUID PK
- messageid UUID FK chatmessages(id)
- user_id UUID FK users(id)
- status VARCHAR — delivered, read
- updated_at TIMESTAMP

2.3.11 Видеосвязь

video_rooms
- id UUID PK
- lessonid UUID FK lessoninstances(id) NULLABLE
- room_name VARCHAR
- provider VARCHAR — webrtc, jitsi, twilio
- config JSONB
- status VARCHAR — created, active, closed
- createdat, closedat

video_participants
- id UUID PK
- roomid UUID FK videorooms(id)
- user_id UUID FK users(id)
- role VARCHAR — host, participant, observer
- joined_at TIMESTAMP
- left_at TIMESTAMP

video_recordings
- id UUID PK
- roomid UUID FK videorooms(id)
- file_url VARCHAR
- duration INT
- size BIGINT
- created_at TIMESTAMP
- retention_until TIMESTAMP

2.3.12 Кастомизация интерфейса

useruiconfigs
- id UUID PK
- user_id UUID FK users(id)
- config JSONB — структура виджетов, позиции, пресеты
- name VARCHAR — имя пресета
- is_default BOOLEAN
- createdat, updatedat

2.3.13 Логи и системные таблицы

audit_logs
- id UUID PK
- user_id UUID FK users(id) NULLABLE
- action VARCHAR
- entity_type VARCHAR
- entity_id UUID NULLABLE
- meta JSONB
- ip VARCHAR
- user_agent VARCHAR
- created_at TIMESTAMP

system_configs
- key VARCHAR PK
- value JSONB
- updated_at TIMESTAMP

2.4 Миграции и seed
- Использовать миграции (Flyway, Liquibase, Knex, TypeORM migrations).
- Seed-скрипты для тестовых данных: 1 admin, 3 tutors, 10 students, 5 parents, 3 subjects, 2 groups.

2.5 Резервирование и бэкапы
- Ежедневный бэкап базы данных.
- Ретеншн: 30 дней для быстрых бэкапов, 1 год для еженедельных.
- Тест восстановления бэкапа ежемесячно.

---

3. Бэкенд: Ядро и Безопасность

3.1 Архитектурные принципы
- Слои: API (controllers) → Application (services/use-cases) → Domain (entities, business rules) → Infrastructure (repositories, external integrations).
- Чёткое разделение ответственности: контроллеры не содержат бизнес-логики.
- DTO/VO для входных и выходных данных.
- Валидация на уровне DTO (Joi, class-validator).
- Обработка ошибок через централизованный middleware с кодами ошибок и структурой ответа.

3.2 API стиль и версионирование
- RESTful API с префиксом /api/v1/.
- Версионирование в URL: /api/v1/....
- OpenAPI/Swagger документация автоматически генерируется и доступна в /api/docs.

3.3 Аутентификация и авторизация

3.3.1 Аутентификация
- Email/phone + пароль.
- Хеширование паролей: argon2 или bcrypt (рекомендуется argon2).
- Подтверждение email при регистрации (опционально).
- Двухфакторная аутентификация (2FA) — опция (TOTP).

3.3.2 Токены
- JWT Access Token: короткий срок (например, 15 минут).
- Refresh Token: долгий срок (например, 30 дней), хранится в БД (refresh_tokens) с привязкой к устройству.
- Ротация refresh-токенов: при использовании старого refresh токена он аннулируется и создаётся новый.
- Logout: удаление refresh token.

3.3.3 RBAC и ACL
- Роли: admin, tutor, student, parent.
- Permissions: набор granular permissions (например, homework.create, homework.grade, user.manage).
- Middleware/guards проверяют роль и наличие permission.
- Дополнительная проверка владения ресурсом (например, tutor может редактировать только свои группы).

3.4 Безопасность API
- Rate limiting: per IP и per user (например, 100 req/min).
- CORS: whitelist доменов.
- CSRF: если используется cookie-based auth.
- Input validation и sanitization.
- Защита от brute-force: блокировка по IP/аккаунту после N неудачных попыток.
- Content Security Policy (CSP) для фронтенда.
- HTTPS обязательный в продакшне.
- Хранение секретов в секрет-менеджере (Vault, AWS Secrets Manager).

3.5 Логирование и мониторинг
- Логирование: структурированные логи (JSON) через Winston/Pino.
- Трассировка запросов: correlation-id в заголовках.
- Интеграция с Sentry для ошибок.
- Метрики: Prometheus + Grafana (latency, error rate, request count).
- Алерты: на рост ошибок, падение сервисов, превышение latency.

3.6 Работа с файлами и медиа
- Хранение файлов: S3-совместимое хранилище (AWS S3, MinIO).
- Ограничения по размеру и типам файлов (конфигурируемые).
- Вирус-сканирование загружаемых файлов (ClamAV) — опция.
- CDN для отдачи медиа.

3.7 Тесты бэкенда
- Unit-тесты для сервисов и утилит.
- Интеграционные тесты для репозиториев и API (использовать тестовую БД).
- Мокирование внешних сервисов (платежи, email, video provider).

---

4. Фронтенд: Дизайн-система "Аттестат UI"

4.1 Цель
Создать компонентную дизайн-систему с единым визуальным языком: мягкие округлые формы, дружественная палитра, адаптивность, микровзаимодействия. Дизайн вдохновлён Duolingo, но уникален по палитре, иллюстрациям и персонажам.

4.2 Технологии
- React + TypeScript.
- State management: Redux Toolkit / Zustand (по выбору).
- Forms: react-hook-form + zod/class-validator.
- Styling: CSS-in-JS (Emotion/Styled Components) или CSS Modules + design tokens.
- Build: Vite.
- Component library: Storybook для документации компонентов.

4.3 Дизайн-токены
- Цвета: primary, secondary, success, warning, danger, background, surface, text.
- Типографика: семейства шрифтов, размеры, line-height.
- Отступы: spacing scale (4,8,12,16...).
- Радиусы: small, medium, large (мягкие округлые формы).
- Тени: elevation levels.
- Иконки: SVG sprite или React-компоненты.

4.4 Компоненты (полный список и поведение)

Базовые
- Button: variants (primary, secondary, ghost), sizes, disabled state, loading state, aria attributes.
- Input: text, number, password, with validation messages.
- Textarea: autosize option.
- Select: single, multi, searchable.
- Checkbox / Radio / Toggle.
- Avatar: initials fallback, upload.
- Badge / Chip.
- Tooltip.
- Modal: accessible, focus trap.
- Toast / Notification: types, stacking.
- Spinner / Skeleton.

Сложные
- Table: sortable, filterable, paginated, virtualized for large datasets.
- DataGrid: inline edit, bulk actions.
- Calendar: day/week/month views, drag-and-drop events.
- RichTextEditor: для создания теории и домашних заданий (attachments).
- FileUploader: drag-and-drop, progress, validation.
- Chat UI: message list, input, attachments, read receipts.
- VideoRoom UI: grid/speaker view, controls, screen share, recording indicator.
- Gamification widgets: progress bar, badges, leaderboards, mini-game containers.
- Dashboard widgets: cards for finance, upcoming lessons, pending homeworks.

4.5 Страницы и маршруты (по ролям)

Общие
- /login, /register, /forgot-password, /reset-password
- /profile, /settings

Репетитор
- /tutor/dashboard — виджеты: расписание, домашки на проверку, финансы.
- /tutor/groups — список групп, управление.
- /tutor/group/:id — карточка группы, список учеников, материалы.
- /tutor/schedule — календарь, шаблоны.
- /tutor/homework — создание/редактирование домашки.
- /tutor/materials — теория, библиотека.
- /tutor/finance — счета, выплаты, отчёты.
- /tutor/chat — список диалогов.

Ученик
- /student/dashboard — прогресс, ближайшие дедлайны, очки.
- /student/homework — список, сдача.
- /student/materials — теория, папки по репетиторам.
- /student/games — мини-игры.
- /student/chat — диалоги.

Родитель
- /parent/dashboard — обзор детей.
- /parent/child/:id — детальная страница ребёнка.
- /parent/payments — счета и оплата.

Админ
- /admin/users, /admin/subjects, /admin/settings, /admin/analytics

4.6 Кастомизация интерфейса (UI builder)
- Режим редактирования: drag-and-drop виджетов на dashboard.
- Сохранение пресетов: UserUIConfig.
- Ограничения: набор доступных виджетов зависит от роли.
- Undo/Redo в режиме редактирования.
- Экспорт/импорт конфигураций (JSON).

4.7 Доступность (a11y)
- Все компоненты соответствуют WCAG 2.1 AA.
- Keyboard navigation, aria-атрибуты, контрастность.

4.8 Тестирование фронтенда
- Unit: Jest + React Testing Library.
- E2E: Playwright / Cypress.
- Visual regression: Chromatic / Percy.

---

5. Модуль: Профили и Настройки

5.1 Цель
Обеспечить полноценный личный кабинет для всех ролей с возможностью управления личными данными, безопасностью, уведомлениями и персональными настройками.

5.2 Функциональные требования

5.2.1 Общие функции (для всех ролей)
- Просмотр профиля: avatar, имя, email, телефон, роль, статус.
- Редактирование профиля: имя, контактные данные, аватар, локаль.
- Изменение пароля: текущий пароль + новый пароль + подтверждение.
- Управление сессиями: список активных сессий (устройство, IP, last seen) с возможностью выхода из конкретной сессии или всех сессий.
- Настройки уведомлений: email, push, SMS; granular настройки по типам (homework, lesson, payment, achievement).
- Настройки приватности: кто видит профиль, публичность достижений.

5.2.2 Репетитор
- Поля: полное имя, образование, сертификаты (attachments), bio, предметы (с выбором уровней), стоимость часа, валюты.
- Управление доступностью: календарь доступности, блоки времени, исключения (vacation).
- Настройка тарифов: per lesson, subscription, custom packages.
- Управление библиотекой: загрузка материалов (домашка/теория), организация папок, теги.
- Настройки видимости материалов: группа, индивидуально, публично.

5.2.3 Ученик
- Поля: имя, класс/grade, уровень, предпочтения по уведомлениям, gamification preferences.
- Просмотр связей с репетиторами и родителями.
- Настройки приватности и отображения достижений.

5.2.4 Родитель
- Управление привязанными детьми: запрос привязки, подтверждение, удаление.
- Настройки уведомлений по каждому ребёнку.
- Просмотр финансовых настроек (карта, автоплатежи).

5.3 API (примерные эндпоинты)
- GET /api/v1/profile — получить профиль текущего пользователя.
- PUT /api/v1/profile — обновить профиль.
- POST /api/v1/profile/avatar — загрузить аватар.
- POST /api/v1/auth/change-password — смена пароля.
- GET /api/v1/sessions — список сессий.
- DELETE /api/v1/sessions/:id — завершить сессию.
- GET /api/v1/notifications/settings — получить настройки уведомлений.
- PUT /api/v1/notifications/settings — обновить настройки.

5.4 UI-страницы и компоненты
- Страница Profile с формой редактирования и секцией безопасности.
- Модал для загрузки сертификатов/файлов.
- Компонент AvailabilityEditor для репетитора (drag-and-drop временных блоков).
- Компонент TariffEditor для управления тарифами.

5.5 Бизнес-правила
- Email уникален в системе.
- При смене email — требуется подтверждение нового email.
- При смене пароля — все refresh-токены аннулируются.
- При удалении аккаунта — soft delete с возможностью восстановления в течение 30 дней.

---

6. Модуль: Администратор

6.1 Цель
Предоставить администратору полный контроль над платформой: управление пользователями, контентом, настройками, аналитикой, мониторингом и доступом к логам.

6.2 Роли внутри админки
- SuperAdmin — полный доступ.
- ContentAdmin — управление предметами, материалами, достижениями.
- SupportAdmin — поддержка пользователей, просмотр логов, сброс паролей.
- FinanceAdmin — управление тарифами, возвратами, выплатами.

6.3 Функциональные требования

6.3.1 Управление пользователями
- Просмотр списка пользователей с фильтрами: роль, статус, email, дата регистрации.
- Просмотр карточки пользователя: профиль, активности, связанные сущности (группы, уроки, домашки).
- Операции: создать пользователя, изменить роль, блокировать/разблокировать, soft delete, восстановление.
- Массовые операции: массовая рассылка, массовая блокировка.

6.3.2 Управление контентом
- CRUD для Subjects.
- CRUD для глобальных Achievement.
- Управление шаблонами писем и уведомлений.
- Управление мини-играми: включение/отключение, конфигурация.

6.3.3 Управление функциональностью (feature flags)
- Включение/отключение модулей: видеозвонки, геймификация, чат, запись уроков, кастомизация UI.
- Настройка глобальных лимитов: max participants in video, max file size, retention periods.

6.3.4 Аналитика и отчёты
- Dashboard: активные пользователи, новые регистрации, уроки за период, средняя посещаемость, доходы.
- Экспорт отчётов в CSV/Excel (по фильтрам).
- Просмотр метрик по видеозвонкам: средняя длительность, процент завершённых, ошибки.

6.3.5 Логи и аудит
- Просмотр AuditLog с фильтрами по пользователю, действию, времени.
- Просмотр системных логов (ошибки, исключения).
- Возможность скачать логи за период.

6.4 API (примерные эндпоинты)
- GET /api/v1/admin/users — список пользователей.
- PUT /api/v1/admin/users/:id — редактирование.
- POST /api/v1/admin/subjects — создать предмет.
- GET /api/v1/admin/analytics — метрики.
- GET /api/v1/admin/logs — логи.

6.5 UI-страницы
- Admin Dashboard — ключевые метрики.
- Users Management — таблица с действиями.
- Content Management — subjects, achievements, games.
- Feature Flags — переключатели модулей.
- Logs & Audit — просмотр и фильтрация.

6.6 Бизнес-правила
- Только SuperAdmin может изменять feature flags и системные конфигурации.
- Все действия админа логируются в AuditLog.
- Ограничение на удаление данных: soft delete + период удержания.

---

7. Модуль: Репетитор — Ученики и Группы

7.1 Цель
Обеспечить репетитору инструменты для управления учениками, создания и ведения групп, отслеживания прогресса и коммуникации.

7.2 Функциональные требования

7.2.1 Управление учениками
- Список учеников с поиском и фильтрами (имя, email, статус, группа).
- Карточка ученика:
  - Профильные данные.
  - Привязанные родители.
  - История занятий (lesson_instances).
  - Посещаемость (attendance).
  - Домашние задания и их статусы.
  - Достижения и очки.
  - Заметки репетитора (private notes).
- Операции:
  - Добавить ученика в группу.
  - Пригласить ученика (email invite).
  - Отправить сообщение родителю/ученику.

7.2.2 Управление группами
- Создание группы: название, предмет, описание, max_students, расписание шаблон.
- Управление составом: добавление/удаление учеников, экспорт списка.
- Настройка расписания группы (связь с lesson_templates).
- Материалы группы: загрузка теории и домашек, организация папок.
- Чат группы: доступ репетитора, ученикам, родителям (по настройке).

7.2.3 UI-страницы
- Groups List — карточки групп, статистика.
- Group Detail — список учеников, расписание, материалы, чат.
- Student Detail — профиль ученика, прогресс, домашки.

7.3 API (примерные эндпоинты)
- GET /api/v1/tutor/students
- GET /api/v1/tutor/students/:id
- POST /api/v1/tutor/groups
- PUT /api/v1/tutor/groups/:id
- POST /api/v1/tutor/groups/:id/students — добавить ученика

7.4 Бизнес-правила
- Репетитор видит только своих учеников и группы, если не имеет админских прав.
- При удалении ученика из группы — история занятий сохраняется, связь помечается как left_at.
- Ограничение на максимальное число групп/учеников по тарифу (конфигурируемо).

---

8. Модуль: Репетитор — Расписание

8.1 Цель
Обеспечить гибкое планирование уроков: шаблоны повторяющихся занятий, генерация конкретных инстансов, управление переносами и отменами, интеграция с видеозвонками.

8.2 Функциональные требования

8.2.1 Календарь
- Представления: день, неделя, месяц.
- Отображение уроков: групповые и индивидуальные.
- Цветовая кодировка по предметам/группам.
- Drag-and-drop для переноса уроков.
- Создание урока через форму или drag-and-drop.

8.2.2 Шаблоны и повторения
- Создание LessonTemplate: weekday, starttime, endtime, repeat_rule (weekly, biweekly, custom).
- Автогенерация LessonInstance на период (например, на 3 месяца вперёд).
- Редактирование серии: изменить все или только одно занятие.

8.2.3 Управление уроком
- Статусы: scheduled, completed, cancelled, no_show.
- Отмена с указанием причины и уведомлением участников.
- Перенос с уведомлением и возможностью подтверждения участниками.
- Привязка VideoRoom: при создании онлайн-урока автоматически создаётся комната (если включено).

8.2.4 Посещаемость
- Форма отметки присутствия: быстрые статусы (present, absent, late).
- Возможность массовой отметки.
- Комментарии по уроку.
- Отчёты по посещаемости за период.

8.2.5 Интеграции календаря
- Экспорт в iCal/Google Calendar (подписка на календарь).
- Импорт событий (опционально).

8.3 API (примерные эндпоинты)
- GET /api/v1/tutor/schedule?view=week&date=YYYY-MM-DD
- POST /api/v1/tutor/lesson-templates
- POST /api/v1/tutor/lesson-instances/generate — генерация по шаблону
- PUT /api/v1/tutor/lesson-instances/:id — перенос/редактирование
- POST /api/v1/tutor/lesson-instances/:id/attendance — отметка посещаемости

8.4 UI-страницы и компоненты
- Schedule Calendar — компонент календаря с drag-and-drop.
- Lesson Editor — форма создания/редактирования урока.
- Attendance Panel — быстрые кнопки для отметки.

8.5 Бизнес-правила
- При создании онлайн-урока: проверка доступности репетитора и учеников (конфликты по времени).
- При массовом переносе серии: уведомление всех участников.
- При отмене: опция автоматического выставления компенсации/возврата (если применимо).

---

9. Модуль: Репетитор — Финансы и Библиотека

9.1 Финансы — функционал

9.1.1 Доходы и отчёты
- Панель с доходами: период (день/неделя/месяц/custom).
- Разбивка по урокам, тарифам, скидкам.
- Графики: доходы по времени, количество уроков.

9.1.2 Счета и оплаты
- Генерация Invoice при выставлении счета.
- Статусы: issued, paid, overdue, cancelled.
- Интеграция с платежными провайдерами (Stripe, PayPal, Yookassa).
- Webhooks для обработки статусов платежей.
- История платежей и транзакций.

9.1.3 Выплаты репетитору
- Расчёт выплат по правилам платформы (процент платформы, комиссии).
- Запрос выплат: создание payout request.
- Статусы выплат: pending, processed, failed.

9.1.4 Экспорт
- Экспорт отчётов в CSV/Excel по фильтрам.

9.2 Библиотека материалов — функционал

9.2.1 Структура
- Два раздела: Домашние задания и Теоретические материалы.
- Внутри — папки и теги.
- Каждый репетитор имеет собственную область: материалы репетитора не смешиваются с материалами других репетиторов.

9.2.2 Загрузка и управление файлами
- Поддержка любых форматов (pdf, docx, pptx, mp4, jpg, png, zip и т.д.) с ограничением по размеру.
- Превью для поддерживаемых форматов.
- Версионирование материалов (history).
- Привязка материалов к урокам, домашкам, группам, отдельным ученикам.

9.2.3 Доступ у ученика
- Ученик видит материалы в двух секциях: Домашка и Теория.
- Внутри каждой секции — папки по репетиторам (автоматически создаются при первой публикации).
- Материалы доступны для скачивания в соответствии с правами доступа.

9.3 API (примерные эндпоинты)
- GET /api/v1/tutor/finance/summary
- GET /api/v1/tutor/invoices
- POST /api/v1/tutor/invoices
- POST /api/v1/tutor/materials — загрузка материала
- GET /api/v1/tutor/materials — список материалов

9.4 UI-страницы и компоненты
- Finance Dashboard — графики, таблицы.
- Invoices List — фильтры, статусы.
- Material Library — дерево папок, drag-and-drop загрузка.
- Material Editor — метаданные, доступы.

9.5 Бизнес-правила
- Материалы репетитора доступны только его ученикам (или группам) по умолчанию.
- При удалении репетитора — материалы сохраняются, доступы переводятся/архивируются по политике.
- Ограничения по размеру файлов и ретеншн записей.

---

10. Модуль: Ученик — Геймификация

10.1 Цель
Мотивировать ученика через систему очков, уровней, достижений и мини-игр, интегрированных с учебным процессом.

10.2 Функциональные требования

10.2.1 Очки и уровни
- Начисление очков за:
  - сдачу домашки (базовые очки + бонус за своевременность)
  - посещаемость
  - активность в мини-играх
  - дополнительные активности (комментарии, помощь другим)
- Уровни: пороги очков для перехода на следующий уровень.
- Визуализация прогресса: progress bar, уровень, значок.

10.2.2 Достижения
- Каталог достижений с условиями (criteria JSON).
- Автоматическое присвоение при выполнении условий.
- Отображение в профиле ученика и в ленте событий.
- Возможность вручную присвоить/отозвать админом.

10.2.3 Ленты и уведомления
- Лента событий: получение очков, новые достижения, рекорды.
- Уведомления: push/email при получении значимых достижений.

10.3 Мини-игры (интеграция с учебным контентом)

10.3.1 Типы игр
- Quiz (викторина): набор вопросов с вариантами ответов, таймер, баллы за скорость и точность.
- Flashcards (карточки): интервальное повторение, статистика по карточкам.
- Match (соответствия): сопоставление терминов и определений/картинок.
- Timed Challenge: серия быстрых вопросов на время.

10.3.2 Создание игр
- Репетитор может:
  - Создавать игры вручную.
  - Генерировать игры на основе теоретических материалов (парсинг ключевых терминов).
  - Назначать игру как тренировку или как часть домашки.

10.3.3 Награды
- Очки за прохождение.
- Дополнительные достижения за streaks, accuracy.
- Виртуальные предметы (скины, рамки) — опционально.

10.4 API (примерные эндпоинты)
- GET /api/v1/games/catalog
- POST /api/v1/games/sessions — начать сессию
- POST /api/v1/games/sessions/:id/answer — отправить ответ
- GET /api/v1/games/sessions/:id/result

10.5 UI-страницы и компоненты
- Games Hub — список доступных игр и прогресс.
- Game Player — интерфейс для каждой игры с таймером, подсказками, прогрессом.
- Achievements — каталог достижений и earned list.

10.6 Бизнес-правила
- Ограничение на количество попыток (конфигурируемо).
- Результаты игр влияют на pointsbalance и studentachievements.
- Репетитор может назначать обязательные игры как часть домашки.

---

11. Модуль: Ученик — Домашка

11.1 Цель
Организовать процесс выдачи, выполнения и проверки домашних заданий с учётом множественных репетиторов и разделения материалов.

11.2 Структура и поведение

11.2.1 Две секции у ученика
- Домашка — задания, требующие сдачи.
- Теория — материалы для изучения.

11.2.2 Папки по репетиторам
- В каждой секции автоматически создаются папки по каждому репетитору, с которым связан ученик.
- Название папки: Фамилия Имя (Tutor) или Tutor: <display_name>.
- При публикации домашки/материала репетитором — материал попадает в соответствующую папку.

11.2.3 Просмотр и фильтрация
- Сортировка по дедлайну, по предмету, по репетитору.
- Фильтры: статус (new, in_progress, submitted, graded, overdue), предмет, репетитор.

11.3 Работа с домашкой

11.3.1 Получение задания
- Уведомление о новой домашке.
- Просмотр описания, материалов, дедлайна, баллов.
- Возможность задать вопрос репетитору (чат/комментарий).

11.3.2 Сдача задания
- Форма сдачи: текстовый ответ + файлы.
- Поддержка любых форматов файлов (ограничения по размеру).
- Возможность редактировать/пересдать до дедлайна (если разрешено).
- Автоматическое создание homeworksubmission и изменение homeworkassign.status.

11.3.3 После проверки
- Репетитор выставляет оценку/баллы и комментарий.
- Начисление очков геймификации (points_transaction).
- Уведомление ученику и родителю (если привязан).

11.4 API (примерные эндпоинты)
- GET /api/v1/student/homework — список
- GET /api/v1/student/homework/:id — детали
- POST /api/v1/student/homework/:id/submit — сдача
- GET /api/v1/student/materials — теория

11.5 UI-страницы и компоненты
- Homework List — карточки с прогрессом.
- Homework Detail — описание, материалы, форма сдачи.
- Submission History — список сдач и оценок.

11.6 Бизнес-правила
- Если репетитор пометил домашку как обязательную, ученик не может скрыть её.
- При просрочке — статус overdue, возможны штрафы по очкам (конфигурируемо).
- Родитель получает уведомления о статусах сдачи и оценках (по настройке).

---

12. Модуль: Родитель — Контроль

12.1 Цель
Дать родителю прозрачный контроль над учебным процессом ребёнка: посещаемость, домашки, достижения, финансы и связь с репетитором.

12.2 Функциональные требования

12.2.1 Привязка к ребёнку
- Родитель может привязать одного или нескольких учеников (через приглашение/код).
- Статус привязки: pending, active, revoked.

12.2.2 Обзор по ребёнку
- Посещаемость: процент посещённых уроков за период, список пропусков.
- Домашка: статус текущих и прошлых заданий, оценки.
- Достижения: список полученных достижений.
- Прогресс: графики по предметам.

12.2.3 Финансовый контроль
- Список счетов по ребёнку/детям.
- Статусы оплат.
- Возможность оплатить счёт (интеграция с платежной системой).
- Напоминания о просроченных платежах.

12.2.4 Связь с репетитором
- Чат с репетитором.
- Запрос отчёта по успеваемости (шаблонный запрос).
- Возможность назначить встречу/звонок.

12.3 API (примерные эндпоинты)
- GET /api/v1/parent/children
- GET /api/v1/parent/child/:id/progress
- GET /api/v1/parent/invoices
- POST /api/v1/parent/payments

12.4 UI-страницы и компоненты
- Parent Dashboard — overview по всем детям.
- Child Detail — детальная статистика.
- Payments — список счетов и оплата.

12.5 Бизнес-правила
- Родитель видит только тех детей, к которым привязан.
- Родитель не видит приватные заметки репетитора, если не предоставлен доступ.
- При оплате счёта родителем — привязка платежа к соответствующему invoice и student.

---

13. Модуль: Чат (Мессенджер)

13.1 Цель
Обеспечить коммуникацию между пользователями: 1-на-1, групповые чаты, системные уведомления, интеграция с уроками и домашками.

13.2 Функциональные требования

13.2.1 Типы чатов
- Private chat: 1-на-1 (tutor-student, tutor-parent, student-parent).
- Group chat: группа урока (tutor + students + optionally parents).
- System chat: уведомления от платформы.

13.2.2 Сообщения
- Текст, вложения (файлы, изображения), ссылки.
- Редактирование и удаление собственных сообщений (в течение configurable window).
- Системные сообщения (создание домашки, назначение урока) — помечены is_system.

13.2.3 Статусы сообщений
- Delivered, Read per participant.
- Push-уведомления при новых сообщениях (если включено).

13.2.4 Поиск и фильтрация
- Поиск по сообщениям в треде.
- Фильтрация по типу вложений.

13.2.5 Модерация
- Возможность репорта сообщения.
- Админский просмотр и удаление сообщений (логирование действий).

13.3 Техническая реализация
- WebSocket (Socket.IO) или WebSocket + Redis Pub/Sub для масштабирования.
- Хранение сообщений в БД (chat_messages) и кеширование последних N сообщений в Redis.
- Pagination: загрузка истории по страницам.

13.4 API и события
- REST для создания тредов и получения истории.
- WebSocket events:
  - message:new
  - message:edit
  - message:delete
  - message:status (delivered/read)
  - thread:typing

13.5 UI-страницы и компоненты
- ChatList — список диалогов с превью.
- ChatWindow — сообщения, input, attachments.
- TypingIndicator, ReadReceipts.

13.6 Бизнес-правила
- Ограничение на размер вложений.
- Сохранение истории сообщений в соответствии с политикой хранения.
- Системные сообщения генерируются автоматически при событиях (создание домашки, назначение урока, изменение статуса оплаты).

---

14. Модуль: Видеосвязь

14.1 Цель
Обеспечить качественные 1-на-1 и групповые онлайн-уроки с возможностью демонстрации экрана, записи и управления участниками.

14.2 Подход к реализации
- Использовать WebRTC для реального времени.
- Для масштабируемых групповых звонков — SFU (Selective Forwarding Unit) через Janus/Jitsi/Twilio.
- Сигналинг через WebSocket (Socket.IO).
- Запись: серверная запись (SFU) или облачные записи провайдера.

14.3 Функциональные требования

14.3.1 Комнаты и доступ
- VideoRoom привязан к LessonInstance.
- Роли: host (tutor), participant (student), observer (parent/admin).
- Лобби: участник ожидает подтверждения от host.
- Возможность заблокировать комнату паролем/токеном.

14.3.2 Управление в комнате
- Включение/выключение камеры и микрофона.
- Демонстрация экрана (screen share).
- Управление участниками: mute/unmute, remove participant.
- Поднятие руки (raise hand).
- Чат внутри комнаты.
- Индикаторы качества сети.
- Запись урока: start/stop, хранение записи в S3, доступ по правам.

14.3.3 Логирование и метрики
- Логи подключения: who joined, when, duration, network stats.
- Метрики: packet loss, jitter, bitrate.

14.4 Интеграция с расписанием и уроками
- При создании LessonInstance с типом online — автоматически создаётся VideoRoom.
- Кнопка Join в карточке урока открывает комнату (проверка прав).
- После завершения — запись привязывается к lesson_instance и доступна в библиотеке (по правам).

14.5 API и события
- REST: POST /api/v1/video/rooms — создать комнату.
- WebSocket: сигналинг для WebRTC (offer/answer/ice).
- Webhook: события от провайдера (recording ready).

14.6 UI-страницы и компоненты
- VideoRoom — grid/speaker layout, controls, participants list, chat.
- Preflight — тест камеры/микрофона перед входом.
- Recording Manager — список записей, доступы, скачивание.

14.7 Бизнес-правила
- Максимальное число участников в комнате — configurable (например, 50).
- Запись хранится ограниченное время (retention), configurable в админке.
- Доступ к записи: tutor, participants, parents (если разрешено), admin.

---

15. Модуль: Кастомизация Интерфейса

15.1 Цель
Дать пользователям (особенно репетиторам и продвинутым ученикам) возможность настраивать рабочие пространства: переставлять виджеты, включать/выключать блоки, сохранять пресеты.

15.2 Функциональные требования

15.2.1 Виджеты
- Набор виджетов по ролям:
  - Репетитор: upcoming lessons, homework to grade, finance summary, quick messages, groups.
  - Ученик: upcoming deadlines, progress, achievements, games, messages.
  - Родитель: child overview, payments, messages.
- Каждый виджет имеет конфиг: title, size (small/medium/large), refresh interval.

15.2.2 Режим редактирования
- Включение режима Customize.
- Drag-and-drop перестановка виджетов.
- Добавление/удаление виджетов из списка доступных.
- Настройка параметров виджета (например, период отображения, фильтры).
- Сохранение пресета как UserUIConfig.

15.2.3 Пресеты и совместное использование
- Возможность сохранить несколько пресетов (например, Work, Review, Compact).
- Экспорт/импорт пресетов (JSON).
- Админ может задавать дефолтные пресеты для ролей.

15.2.4 Ограничения
- Некоторые виджеты могут быть запрещены для определённых ролей.
- Ограничение на количество виджетов на странице (конфигурируемо).

15.3 API (примерные эндпоинты)
- GET /api/v1/ui/config — получить текущую конфигурацию пользователя.
- POST /api/v1/ui/config — сохранить конфигурацию.
- GET /api/v1/ui/widgets — список доступных виджетов.

15.4 UI-страницы и компоненты
- Dashboard Editor — drag-and-drop canvas, widget palette, save/load presets.
- Widget — стандартный интерфейс для настройки и отображения.

15.5 Бизнес-правила
- При смене роли пользователя — применяются дефолтные пресеты для новой роли.
- При удалении пресета — если он был дефолтным, назначается другой дефолт.

---

16. Интеграция и Тесты

16.1 Интеграция модулей — сквозные сценарии (полная детализация)
Для каждой ключевой бизнес-функции описать сквозный сценарий, предусмотреть все ветвления, ошибки и ожидаемые результаты. Ниже — полный набор сквозных сценариев с шагами, API-вызовами, проверками и ожидаемыми состояниями.

16.1.1 Сценарий: Регистрация ученика и привязка родителя
Шаги:
1. Родитель регистрируется: POST /api/v1/auth/register (role=parent) → ожидаемый ответ 201, user_id.
2. Родитель подтверждает email (если включено): GET /api/v1/auth/confirm?token=... → 200.
3. Родитель создаёт профиль ребёнка (или приглашает): POST /api/v1/parent/children/invite → создаётся invite token.
4. Ученик регистрируется по invite: POST /api/v1/auth/register?invite=token → user created, parent_student row created with status active.
5. Проверки:
   - В таблице parentstudent есть запись с parentid и student_id.
   - Родитель видит ребёнка в GET /api/v1/parent/children.
   - Ученик имеет пустой профиль student_profile, ожидается заполнение.

Ошибки и ветвления:
- Invite expired → 400 with error invite_expired.
- Email already exists → 409.

16.1.2 Сценарий: Репетитор создаёт группу, назначает расписание, выдаёт домашку, ученик сдаёт, репетитор проверяет, родитель видит отчёт
Шаги:
1. Репетитор создаёт группу: POST /api/v1/tutor/groups → group_id.
2. Репетитор создаёт lessontemplate: POST /api/v1/tutor/lesson-templates → templateid.
3. Система генерирует lesson_instances на месяц: POST /api/v1/tutor/lesson-instances/generate → list of instances.
4. Репетитор создаёт homework: POST /api/v1/tutor/homework с visibility = group → homework_id.
5. Система создаёт homework_assigns для всех студентов группы.
6. Ученик получает уведомление и видит домашку в GET /api/v1/student/homework.
7. Ученик сдаёт: POST /api/v1/student/homework/:id/submit → submissionid, homeworkassign.status = submitted.
8. Репетитор проверяет: PUT /api/v1/tutor/homework/:id/grade → updates homework_submission.score, status = graded.
9. Система начисляет очки: create pointstransaction, update pointsbalance.
10. Родитель получает уведомление и может просмотреть отчёт: GET /api/v1/parent/child/:id/progress.

Проверки:
- homework_assign.status transitions: assigned → submitted → graded.
- points_balance updated correctly.
- student_achievements created if criteria met.

Ошибки и ветвления:
- Ученик пытается сдать после дедлайна и опция allowlatesubmissions=false → 403.
- Репетитор пытается оценить чужую домашку → 403.

16.1.3 Сценарий: Онлайн-урок с записью
Шаги:
1. Репетитор создаёт lesson_instance с type=online.
2. Система создаёт videoroom и возвращает videoroom_id.
3. В назначенное время участники нажимают Join → WebRTC сигналинг.
4. Host запускает запись: POST /api/v1/video/rooms/:id/record/start.
5. Урок проходит, host останавливает запись: POST /api/v1/video/rooms/:id/record/stop.
6. Провайдер уведомляет webhook recordingready с fileurl.
7. Система сохраняет запись в videorecordings и привязывает к lessoninstance.
8. Доступ к записи: tutor + participants + parents (если разрешено).

Проверки:
- video_room.status transitions: created → active → closed.
- videorecordings entry exists with valid fileurl.
- Retention policy applied.

Ошибки и ветвления:
- Участник с плохой сетью — сигнал качества, fallback to audio-only.
- Запись не готова — retry logic, уведомление админа.

16.1.4 Сценарий: Платёж и выставление счёта
Шаги:
1. Система генерирует invoice для student/parent: POST /api/v1/invoices.
2. Parent получает уведомление и переходит к оплате.
3. Parent инициирует платёж через провайдера (Stripe Checkout).
4. Провайдер вызывает webhook payment_succeeded.
5. Система обновляет invoice.status = paid, создаёт payment record.
6. Если платёж failed → invoice.status = overdue и отправляется напоминание.

Проверки:
- invoice и payment связаны.
- Webhook верифицируется подписью провайдера.
- Refund flow: POST /api/v1/payments/:id/refund.

Ошибки и ветвления:
- Несоответствие суммы → лог и ручная проверка.
- Chargeback → статус disputed, уведомление finance admin.

16.1.5 Сценарий: Кастомизация UI и сохранение пресета
Шаги:
1. Пользователь открывает Dashboard Editor.
2. Перетаскивает виджеты, настраивает параметры.
3. Нажимает Save as preset → POST /api/v1/ui/config с JSON.
4. Система сохраняет useruiconfigs и помечает как default.
5. При следующем входе конфигурация загружается и применяется.

Проверки:
- JSON валидируется по схеме.
- Ограничения по виджетам применяются (role-based).
- Undo/Redo работает в сессии.

Ошибки и ветвления:
- Неверная схема JSON → 400 с описанием ошибки.
- Попытка сохранить запрещённый виджет → 403.

16.1.6 Сценарий: Игры и начисление очков
Шаги:
1. Ученик запускает игру: POST /api/v1/games/sessions.
2. В процессе игры отправляются ответы: POST /api/v1/games/sessions/:id/answer.
3. По завершении система рассчитывает score и accuracy.
4. Создаётся gameresult, обновляется pointsbalance, возможно присваивается achievement.
5. Репетитор видит результаты в GET /api/v1/tutor/game-results.

Проверки:
- Транзакция: запись gameresult и pointstransaction атомарны.
- Achievement criteria проверяются и применяются.

Ошибки и ветвления:
- Попытка обойти лимиты (rate limiting) → 429.
- Неконсистентность данных → откат транзакции и лог.

16.1.7 Сценарий: Модерация и админские действия
Шаги:
1. SupportAdmin получает репорт о сообщении.
2. SupportAdmin просматривает сообщение и принимает действие: delete, warn user, suspend user.
3. Действие логируется в AuditLog.
4. При необходимости SupportAdmin эскалирует к SuperAdmin.

Проверки:
- AuditLog содержит запись с user_id, action, meta.
- Уведомления отправлены при необходимости.

Ошибки и ветвления:
- Попытка SupportAdmin выполнить действие, требующее SuperAdmin → 403.

16.1.8 Сценарий: Полный цикл разработки фичи (CI/CD)
Шаги:
1. Developer создаёт feature branch и пушит PR.
2. CI запускает линтер, unit-тесты, сборку фронтенда.
3. При успешном CI — деплой на staging.
4. QA выполняет E2E тесты.
5. При успешном QA — merge в main и деплой в production через CD.
6. Мониторинг проверяет метрики и алерты.

Проверки:
- CI pipeline должен быть зелёным.
- Smoke tests на staging успешны.
- Rollback план доступен.

16.2 Тестирование (полная детализация)

16.2.1 Unit-тесты
- Покрытие: бизнес-логика, утилиты, сервисы.
- Инструменты: Jest (Node), testing-library (React).
- Тесты должны быть быстрыми и изолированными.

16.2.2 Интеграционные тесты
- Тестирование взаимодействия с БД (использовать тестовую БД или контейнер).
- Тесты для репозиториев, транзакций, webhooks.
- Инструменты: Jest + supertest.

16.2.3 E2E-тесты
- Сценарии: регистрация, создание группы, расписание, сдача домашки, оплата, видеозвонок (smoke).
- Инструменты: Playwright / Cypress.
- Тесты запускаются в CI на staging.

16.2.4 Нагрузочное тестирование
- Цели: определить максимальную нагрузку, bottlenecks.
- Инструменты: k6, Gatling.
- Тестовые сценарии:
  - Одновременные 1000 пользователей в чате.
  - 200 параллельных видеозвонков (проверка SFU).
  - Пиковая нагрузка при массовой рассылке уведомлений.
- Метрики: latency, error rate, CPU, memory, DB connections.

16.2.5 Безопасностные тесты
- SAST/DAST сканирование (Snyk, OWASP ZAP).
- Penetration testing (регулярно, минимум раз в год).

16.2.6 Тестовые данные и окружения
- Отдельные окружения: dev, staging, prod.
- Тестовые данные: seed scripts, fixtures.
- Изоляция тестовой БД.

16.2.7 Критерии приёмки
- Unit coverage >= 70% для критичных модулей.
- E2E сценарии для ключевых фич должны проходить в CI.
- Нагрузочные тесты: 95-й перцентиль latency < target (например, 500ms для API).

---

17. Финализация

17.1 Документация (полная)

17.1.1 Техническая документация
- Архитектура системы (диаграммы): компонентная диаграмма, sequence diagrams для ключевых сценариев.
- Описание БД: ER-диаграмма, таблицы, поля, индексы.
- API спецификация: OpenAPI/Swagger с примерами запросов/ответов и кодами ошибок.
- CI/CD pipeline: описание шагов, rollback procedure.
- DevOps runbook: деплой, бэкап, восстановление, мониторинг, контакты on-call.
- Security policy: хранение секретов, rotation, incident response.

17.1.2 Пользовательская документация
- Руководства: для репетитора, ученика, родителя, администратора.
- FAQ.
- How-to: создание группы, назначение домашки, проведение онлайн-урока, оплата счёта.
- Видео-инструкции (опционально).

17.2 Продакшн и эксплуатация

17.2.1 Развёртывание
- Инфраструктура: контейнеризация (Docker), оркестрация (Kubernetes) — рекомендовано.
- Сеть: HTTPS, Load Balancer, CDN.
- БД: managed PostgreSQL (RDS/Azure DB) с репликацией.
- Storage: S3-compatible для медиа.
- Secrets: Vault / cloud secrets manager.

17.2.2 Мониторинг и алерты
- Метрики: Prometheus + Grafana dashboards.
- Логи: централизованный лог-агрегатор (ELK/EFK).
- Error tracking: Sentry.
- Алерты: PagerDuty/Teams/Slack интеграция.

17.2.3 Бэкапы и восстановление
- Регулярные бэкапы БД и медиа.
- Тест восстановления.
