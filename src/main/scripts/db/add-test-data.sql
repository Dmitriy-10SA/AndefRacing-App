--------------------------------------------------------------------------------------------
-- Добавление тестовых данных
--------------------------------------------------------------------------------------------

--------------------------------------------------------------------------------------------
-- Добавление регионов, городов и клубов
--------------------------------------------------------------------------------------------
-- Добавление региона "Самарская область"
DO
$$
    DECLARE
        v_region_id   SMALLINT;
        v_samara_id   SMALLINT;
        v_tolyatti_id SMALLINT;
    BEGIN
        v_region_id := admin_management.add_region('Самарская область');
        v_samara_id := admin_management.add_city(v_region_id, 'Самара');
        v_tolyatti_id := admin_management.add_city(v_region_id, 'Тольятти');

        -- Для Самары
        PERFORM admin_management.add_club(
                v_samara_id,
                'AndefRacing Самара ТЦ Коспопорт'::VARCHAR(100),
                '+7-920-208-40-32'::VARCHAR(16),
                'cosmoport_samara@andefracing.ru'::TEXT,
                'ул. Дыбенко 30 (ТЦ Коспопорт)'::TEXT,
                6::SMALLINT,
                'Семкин'::VARCHAR,
                'Дмитрий'::VARCHAR,
                'Андреевич'::VARCHAR,
                '+7-937-983-75-33'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_samara_id,
                'AndefRacing Самара ТЦ Гудок'::VARCHAR(100),
                '+7-922-218-41-32'::VARCHAR(16),
                'gudok_samara@andefracing.ru'::TEXT,
                'ул. Красноармейская 131 (ТЦ Гудок)'::TEXT,
                5::SMALLINT,
                'Семкин'::VARCHAR,
                'Дмитрий'::VARCHAR,
                'Андреевич'::VARCHAR,
                '+7-937-983-75-33'::VARCHAR
                );

        -- Для Тольятти
        PERFORM admin_management.add_club(
                v_tolyatti_id,
                'AndefRacing Тольятти ТЦ Парк Хаус'::VARCHAR(100),
                '+7-937-983-75-33'::VARCHAR(16),
                'parkhaus_tolyatti@andefracing.ru'::TEXT,
                'Автозаводское шоссе 6 (ТЦ Парк Хаус)'::TEXT,
                3::SMALLINT,
                'Иванов'::VARCHAR,
                'Петр'::VARCHAR,
                'Дмитриевич'::VARCHAR,
                '+7-911-923-31-33'::VARCHAR
                );
    END
$$;

-- Добавление региона "Саратовская область"
DO
$$
    DECLARE
        v_region_id  SMALLINT;
        v_saratov_id SMALLINT;
    BEGIN
        v_region_id := admin_management.add_region('Саратовская область');
        v_saratov_id := admin_management.add_city(v_region_id, 'Саратов');

        -- Для Саратова
        PERFORM admin_management.add_club(
                v_saratov_id,
                'AndefRacing Саратов ТЦ Триумф'::VARCHAR(100),
                '+7-845-200-20-01'::VARCHAR(16),
                'triumph_saratov@andefracing.ru'::TEXT,
                'ул. имени В.С.Зарубина 167 (ТЦ Триумф)'::TEXT,
                4::SMALLINT,
                'Смирнов'::VARCHAR,
                'Алексей'::VARCHAR,
                'Викторович'::VARCHAR,
                '+7-845-555-11-22'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_saratov_id,
                'AndefRacing Саратов ТЦ Форум'::VARCHAR(100),
                '+7-845-250-20-02'::VARCHAR(16),
                'forum_saratov@andefracing.ru'::TEXT,
                'ул. Танкистов 1 (ТЦ Форум)'::TEXT,
                6::SMALLINT,
                'Смирнов'::VARCHAR,
                'Алексей'::VARCHAR,
                'Викторович'::VARCHAR,
                '+7-845-555-11-22'::VARCHAR
                );
    END
$$;

-- Добавление региона "Оренбургская область"
DO
$$
    DECLARE
        v_region_id   SMALLINT;
        v_orenburg_id SMALLINT;
    BEGIN
        v_region_id := admin_management.add_region('Оренбургская область');
        v_orenburg_id := admin_management.add_city(v_region_id, 'Оренбург');

        -- Клуб в Оренбурге
        PERFORM admin_management.add_club(
                v_orenburg_id,
                'AndefRacing Оренбург ТЦ Восход'::VARCHAR(100),
                '+7-353-200-30-01'::VARCHAR(16),
                'voshod_orenburg@andefracing.ru'::TEXT,
                'просп. Победы 1А (ТЦ Восход)'::TEXT,
                8::SMALLINT,
                'Федоров'::VARCHAR,
                'Максим'::VARCHAR,
                'Игоревич'::VARCHAR,
                '+7-353-555-77-88'::VARCHAR
                );
    END
$$;

--------------------------------------------------------------------------------------------
-- Добавление игр
--------------------------------------------------------------------------------------------
INSERT INTO games.game (name, photo_url, is_active)
VALUES ('Assetto Corsa Competizione', '/files/games/assetocorsacompetizione.svg', TRUE),
       ('Assetto Corsa Evo', '/files/games/assetocorsaevo.svg', TRUE),
       ('BeamNG.drive', '/files/games/beamngdrive.svg', TRUE),
       ('CarX', '/files/games/carx.svg', TRUE),
       ('R2', '/files/games/r2.svg', TRUE),
       ('W2S', '/files/games/w2s.svg', TRUE);

--------------------------------------------------------------------------------------------
-- Добавление фотографий для клубов
--------------------------------------------------------------------------------------------
-- Фотографии для клуба "AndefRacing Самара ТЦ Коспопорт" (club_id = 1)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (1, '/files/clubs/1/космопорт_клуб.jpg', 1),
       (1, '/files/clubs/1/космопорт_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Самара ТЦ Гудок" (club_id = 2)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (2, '/files/clubs/2/гудок_клуб.jpg', 1),
       (2, '/files/clubs/2/гудок_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Тольятти ТЦ Парк Хаус" (club_id = 3)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (3, '/files/clubs/3/парк_хаус_клуб.jpg', 1),
       (3, '/files/clubs/3/парк_хаус_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Саратов ТЦ Триумф" (club_id = 4)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (4, '/files/clubs/4/триумф_клуб.jpg', 1),
       (4, '/files/clubs/4/триумф_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Саратов ТЦ Форум" (club_id = 5)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (5, '/files/clubs/5/форум_клуб.jpg', 1),
       (5, '/files/clubs/5/форум_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Оренбург ТЦ Восход" (club_id = 6)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (6, '/files/clubs/6/восход_клуб.jpg', 1),
       (6, '/files/clubs/6/восход_тц.jpg', 2);


--------------------------------------------------------------------------------------------
-- Добавление цен для клубов
--------------------------------------------------------------------------------------------
-- Цены для клубов Самары (club_id = 1, 2)
-- Клуб "AndefRacing Самара ТЦ Коспопорт" (club_id = 1)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (1, 15, 350.00),
       (1, 30, 500.00),
       (1, 60, 700.00),
       (1, 90, 1050.00),
       (1, 120, 1400.00),
       (1, 150, 1750.00),
       (1, 180, 2100.00),
       (1, 210, 2450.00),
       (1, 240, 2800.00);

-- Клуб "AndefRacing Самара ТЦ Гудок" (club_id = 2)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (2, 15, 350.00),
       (2, 30, 500.00),
       (2, 60, 700.00),
       (2, 90, 1050.00),
       (2, 120, 1400.00),
       (2, 150, 1750.00),
       (2, 180, 2100.00),
       (2, 210, 2450.00),
       (2, 240, 2800.00);

-- Цены для клубов Тольятти, Саратова и Оренбурга (club_id = 3, 4, 5, 6)
-- Клуб "AndefRacing Тольятти ТЦ Парк Хаус" (club_id = 3)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (3, 15, 300.00),
       (3, 30, 450.00),
       (3, 60, 650.00),
       (3, 90, 1000.00),
       (3, 120, 1350.00),
       (3, 150, 1700.00),
       (3, 180, 2050.00),
       (3, 210, 2400.00),
       (3, 240, 2750.00);

-- Клуб "AndefRacing Саратов ТЦ Триумф" (club_id = 4)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (4, 15, 300.00),
       (4, 30, 450.00),
       (4, 60, 650.00),
       (4, 90, 1000.00),
       (4, 120, 1350.00),
       (4, 150, 1700.00),
       (4, 180, 2050.00),
       (4, 210, 2400.00),
       (4, 240, 2750.00);

-- Клуб "AndefRacing Саратов ТЦ Форум" (club_id = 5)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (5, 15, 300.00),
       (5, 30, 450.00),
       (5, 60, 650.00),
       (5, 90, 1000.00),
       (5, 120, 1350.00),
       (5, 150, 1700.00),
       (5, 180, 2050.00),
       (5, 210, 2400.00),
       (5, 240, 2750.00);

-- Клуб "AndefRacing Оренбург ТЦ Восход" (club_id = 6)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (6, 15, 300.00),
       (6, 30, 450.00),
       (6, 60, 650.00),
       (6, 90, 1000.00),
       (6, 120, 1350.00),
       (6, 150, 1700.00),
       (6, 180, 2050.00),
       (6, 210, 2400.00),
       (6, 240, 2750.00);


--------------------------------------------------------------------------------------------
-- Добавление игр в клубы
--------------------------------------------------------------------------------------------
-- Добавляем все игры во все клубы
-- Клуб "AndefRacing Самара ТЦ Коспопорт" (club_id = 1)
INSERT INTO info.game_club (club_id, game_id)
VALUES (1, 1), -- Assetto Corsa Competizione
       (1, 2), -- Assetto Corsa Evo
       (1, 3), -- BeamNG.drive
       (1, 4), -- CarX
       (1, 5), -- R2
       (1, 6); -- W2S

-- Клуб "AndefRacing Самара ТЦ Гудок" (club_id = 2)
INSERT INTO info.game_club (club_id, game_id)
VALUES (2, 1), -- Assetto Corsa Competizione
       (2, 2), -- Assetto Corsa Evo
       (2, 3), -- BeamNG.drive
       (2, 4), -- CarX
       (2, 5), -- R2
       (2, 6); -- W2S

-- Клуб "AndefRacing Тольятти ТЦ Парк Хаус" (club_id = 3)
INSERT INTO info.game_club (club_id, game_id)
VALUES (3, 1), -- Assetto Corsa Competizione
       (3, 2), -- Assetto Corsa Evo
       (3, 3), -- BeamNG.drive
       (3, 4), -- CarX
       (3, 5), -- R2
       (3, 6); -- W2S

-- Клуб "AndefRacing Саратов ТЦ Триумф" (club_id = 4)
INSERT INTO info.game_club (club_id, game_id)
VALUES (4, 1), -- Assetto Corsa Competizione
       (4, 2), -- Assetto Corsa Evo
       (4, 3), -- BeamNG.drive
       (4, 4), -- CarX
       (4, 5), -- R2
       (4, 6); -- W2S

-- Клуб "AndefRacing Саратов ТЦ Форум" (club_id = 5)
INSERT INTO info.game_club (club_id, game_id)
VALUES (5, 1), -- Assetto Corsa Competizione
       (5, 2), -- Assetto Corsa Evo
       (5, 3), -- BeamNG.drive
       (5, 4), -- CarX
       (5, 5), -- R2
       (5, 6); -- W2S

-- Клуб "AndefRacing Оренбург ТЦ Восход" (club_id = 6)
INSERT INTO info.game_club (club_id, game_id)
VALUES (6, 1), -- Assetto Corsa Competizione
       (6, 2), -- Assetto Corsa Evo
       (6, 3), -- BeamNG.drive
       (6, 4), -- CarX
       (6, 5), -- R2
       (6, 6); -- W2S


--------------------------------------------------------------------------------------------
-- Добавление сотрудников в клубы
--------------------------------------------------------------------------------------------
-- Сотрудники для клуба "AndefRacing Самара ТЦ Коспопорт" (club_id = 1)
-- Управляющий уже добавлен при создании клуба (employee_id = 1)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Петров', 'Иван', 'Сергеевич', '+7-927-123-45-67', NULL, TRUE, FALSE),
       ('Сидорова', 'Анна', 'Петровна', '+7-927-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 2, 3)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (1, 2, 'EMPLOYEE'),
       (1, 2, 'ADMIN'),
       (1, 3, 'EMPLOYEE'),
       (1, 3, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Козлов', 'Алексей', 'Викторович', '+7-927-345-67-89', NULL, TRUE, FALSE),
       ('Морозова', 'Елена', 'Игоревна', '+7-927-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 4, 5)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (1, 4, 'EMPLOYEE'),
       (1, 5, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Самара ТЦ Гудок" (club_id = 2)
-- Управляющий тот же, что и в первом клубе (employee_id = 1)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Новиков', 'Сергей', 'Александрович', '+7-927-567-89-01', NULL, TRUE, FALSE),
       ('Волкова', 'Мария', 'Дмитриевна', '+7-927-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 6, 7)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (2, 6, 'EMPLOYEE'),
       (2, 6, 'ADMIN'),
       (2, 7, 'EMPLOYEE'),
       (2, 7, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Соколов', 'Дмитрий', 'Павлович', '+7-927-789-01-23', NULL, TRUE, FALSE),
       ('Лебедева', 'Ольга', 'Сергеевна', '+7-927-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 8, 9)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (2, 8, 'EMPLOYEE'),
       (2, 9, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Тольятти ТЦ Парк Хаус" (club_id = 3)
-- Управляющий уже добавлен при создании клуба (employee_id = 10)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Кузнецов', 'Андрей', 'Николаевич', '+7-917-123-45-67', NULL, TRUE, FALSE),
       ('Павлова', 'Татьяна', 'Владимировна', '+7-917-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 11, 12)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (3, 11, 'EMPLOYEE'),
       (3, 11, 'ADMIN'),
       (3, 12, 'EMPLOYEE'),
       (3, 12, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Федоров', 'Николай', 'Иванович', '+7-917-345-67-89', NULL, TRUE, FALSE),
       ('Егорова', 'Светлана', 'Алексеевна', '+7-917-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 13, 14)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (3, 13, 'EMPLOYEE'),
       (3, 14, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Саратов ТЦ Триумф" (club_id = 4)
-- Управляющий уже добавлен при создании клуба (employee_id = 15)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Михайлов', 'Владимир', 'Петрович', '+7-845-123-45-67', NULL, TRUE, FALSE),
       ('Романова', 'Наталья', 'Сергеевна', '+7-845-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 16, 17)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (4, 16, 'EMPLOYEE'),
       (4, 16, 'ADMIN'),
       (4, 17, 'EMPLOYEE'),
       (4, 17, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Васильев', 'Игорь', 'Андреевич', '+7-845-345-67-89', NULL, TRUE, FALSE),
       ('Захарова', 'Юлия', 'Викторовна', '+7-845-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 18, 19)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (4, 18, 'EMPLOYEE'),
       (4, 19, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Саратов ТЦ Форум" (club_id = 5)
-- Управляющий тот же, что и в клубе Триумф (employee_id = 15)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Григорьев', 'Павел', 'Михайлович', '+7-845-567-89-01', NULL, TRUE, FALSE),
       ('Степанова', 'Ирина', 'Николаевна', '+7-845-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 20, 21)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (5, 20, 'EMPLOYEE'),
       (5, 20, 'ADMIN'),
       (5, 21, 'EMPLOYEE'),
       (5, 21, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Семенов', 'Артем', 'Владимирович', '+7-845-789-01-23', NULL, TRUE, FALSE),
       ('Макарова', 'Екатерина', 'Игоревна', '+7-845-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 22, 23)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (5, 22, 'EMPLOYEE'),
       (5, 23, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Оренбург ТЦ Восход" (club_id = 6)
-- Управляющий уже добавлен при создании клуба (employee_id = 24)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Борисов', 'Константин', 'Александрович', '+7-353-123-45-67', NULL, TRUE, FALSE),
       ('Николаева', 'Виктория', 'Дмитриевна', '+7-353-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 25, 26)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (6, 25, 'EMPLOYEE'),
       (6, 25, 'ADMIN'),
       (6, 26, 'EMPLOYEE'),
       (6, 26, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Орлов', 'Евгений', 'Сергеевич', '+7-353-345-67-89', NULL, TRUE, FALSE),
       ('Белова', 'Алина', 'Павловна', '+7-353-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 27, 28)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (6, 27, 'EMPLOYEE'),
       (6, 28, 'EMPLOYEE');

-- Добавление региона "Республика Татарстан"
DO
$$
    DECLARE
        v_region_id SMALLINT;
        v_kazan_id  SMALLINT;
        v_chelny_id SMALLINT;
    BEGIN
        v_region_id := admin_management.add_region('Республика Татарстан');
        v_kazan_id := admin_management.add_city(v_region_id, 'Казань');
        v_chelny_id := admin_management.add_city(v_region_id, 'Набережные Челны');

        -- Для Казани
        PERFORM admin_management.add_club(
                v_kazan_id,
                'AndefRacing Казань ТЦ Кольцо'::VARCHAR(100),
                '+7-843-200-50-01'::VARCHAR(16),
                'kolco_kazan@andefracing.ru'::TEXT,
                'ул. Петербургская 1 (ТЦ Кольцо)'::TEXT,
                6::SMALLINT,
                'Гильманов'::VARCHAR,
                'Рустам'::VARCHAR,
                'Маратович'::VARCHAR,
                '+7-843-555-22-33'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_kazan_id,
                'AndefRacing Казань ТЦ Мега'::VARCHAR(100),
                '+7-843-200-50-02'::VARCHAR(16),
                'mega_kazan@andefracing.ru'::TEXT,
                'ул. Победы 141 (ТЦ Мега)'::TEXT,
                8::SMALLINT,
                'Гильманов'::VARCHAR,
                'Рустам'::VARCHAR,
                'Маратович'::VARCHAR,
                '+7-843-555-22-33'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_kazan_id,
                'AndefRacing Казань ТЦ Южный'::VARCHAR(100),
                '+7-843-200-50-03'::VARCHAR(16),
                'yuzhniy_kazan@andefracing.ru'::TEXT,
                'ул. Южная 9 (ТЦ Южный)'::TEXT,
                5::SMALLINT,
                'Гильманов'::VARCHAR,
                'Рустам'::VARCHAR,
                'Маратович'::VARCHAR,
                '+7-843-555-22-33'::VARCHAR
                );

        -- Для Набережных Челнов
        PERFORM admin_management.add_club(
                v_chelny_id,
                'AndefRacing Набережные Челны ТЦ Торговый Квартал'::VARCHAR(100),
                '+7-855-200-60-01'::VARCHAR(16),
                'torgkvartal_chelny@andefracing.ru'::TEXT,
                'просп. Мира 56 (ТЦ Торговый Квартал)'::TEXT,
                4::SMALLINT,
                'Хасанов'::VARCHAR,
                'Ильдар'::VARCHAR,
                'Рафаэльевич'::VARCHAR,
                '+7-855-555-44-55'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_chelny_id,
                'AndefRacing Набережные Челны ТЦ Эссен'::VARCHAR(100),
                '+7-855-200-60-02'::VARCHAR(16),
                'essen_chelny@andefracing.ru'::TEXT,
                'просп. Хасана Туфана 27 (ТЦ Эссен)'::TEXT,
                6::SMALLINT,
                'Хасанов'::VARCHAR,
                'Ильдар'::VARCHAR,
                'Рафаэльевич'::VARCHAR,
                '+7-855-555-44-55'::VARCHAR
                );
    END
$$;

-- Добавление региона "Республика Башкортостан"
DO
$$
    DECLARE
        v_region_id SMALLINT;
        v_ufa_id    SMALLINT;
    BEGIN
        v_region_id := admin_management.add_region('Республика Башкортостан');
        v_ufa_id := admin_management.add_city(v_region_id, 'Уфа');

        -- Для Уфы
        PERFORM admin_management.add_club(
                v_ufa_id,
                'AndefRacing Уфа ТЦ Планета'::VARCHAR(100),
                '+7-347-200-70-01'::VARCHAR(16),
                'planeta_ufa@andefracing.ru'::TEXT,
                'ул. Менделеева 137 (ТЦ Планета)'::TEXT,
                7::SMALLINT,
                'Валеев'::VARCHAR,
                'Айрат'::VARCHAR,
                'Рашидович'::VARCHAR,
                '+7-347-555-66-77'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_ufa_id,
                'AndefRacing Уфа ТЦ Мега'::VARCHAR(100),
                '+7-347-200-70-02'::VARCHAR(16),
                'mega_ufa@andefracing.ru'::TEXT,
                'ул. Рубежная 174 (ТЦ Мега)'::TEXT,
                6::SMALLINT,
                'Валеев'::VARCHAR,
                'Айрат'::VARCHAR,
                'Рашидович'::VARCHAR,
                '+7-347-555-66-77'::VARCHAR
                );
    END
$$;

-- Добавление региона "Свердловская область"
DO
$$
    DECLARE
        v_region_id        SMALLINT;
        v_ekaterinburg_id  SMALLINT;
    BEGIN
        v_region_id := admin_management.add_region('Свердловская область');
        v_ekaterinburg_id := admin_management.add_city(v_region_id, 'Екатеринбург');

        -- Для Екатеринбурга
        PERFORM admin_management.add_club(
                v_ekaterinburg_id,
                'AndefRacing Екатеринбург ТЦ Гринвич'::VARCHAR(100),
                '+7-343-200-80-01'::VARCHAR(16),
                'greenwich_ekb@andefracing.ru'::TEXT,
                'ул. 8 Марта 46 (ТЦ Гринвич)'::TEXT,
                8::SMALLINT,
                'Соловьев'::VARCHAR,
                'Артем'::VARCHAR,
                'Владимирович'::VARCHAR,
                '+7-343-555-88-99'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_ekaterinburg_id,
                'AndefRacing Екатеринбург ТЦ Алатырь'::VARCHAR(100),
                '+7-343-200-80-02'::VARCHAR(16),
                'alatyr_ekb@andefracing.ru'::TEXT,
                'ул. Малышева 5 (ТЦ Алатырь)'::TEXT,
                6::SMALLINT,
                'Соловьев'::VARCHAR,
                'Артем'::VARCHAR,
                'Владимирович'::VARCHAR,
                '+7-343-555-88-99'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_ekaterinburg_id,
                'AndefRacing Екатеринбург ТЦ Мега'::VARCHAR(100),
                '+7-343-200-80-03'::VARCHAR(16),
                'mega_ekb@andefracing.ru'::TEXT,
                'ул. Металлургов 87 (ТЦ Мега)'::TEXT,
                7::SMALLINT,
                'Соловьев'::VARCHAR,
                'Артем'::VARCHAR,
                'Владимирович'::VARCHAR,
                '+7-343-555-88-99'::VARCHAR
                );
    END
$$;

-- Добавление региона "Новосибирская область"
DO
$$
    DECLARE
        v_region_id       SMALLINT;
        v_novosibirsk_id  SMALLINT;
    BEGIN
        v_region_id := admin_management.add_region('Новосибирская область');
        v_novosibirsk_id := admin_management.add_city(v_region_id, 'Новосибирск');

        -- Для Новосибирска
        PERFORM admin_management.add_club(
                v_novosibirsk_id,
                'AndefRacing Новосибирск ТЦ Аура'::VARCHAR(100),
                '+7-383-200-90-01'::VARCHAR(16),
                'aura_nsk@andefracing.ru'::TEXT,
                'ул. Станционная 2А (ТЦ Аура)'::TEXT,
                8::SMALLINT,
                'Ковалев'::VARCHAR,
                'Денис'::VARCHAR,
                'Сергеевич'::VARCHAR,
                '+7-383-555-11-00'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_novosibirsk_id,
                'AndefRacing Новосибирск ТЦ Мега'::VARCHAR(100),
                '+7-383-200-90-02'::VARCHAR(16),
                'mega_nsk@andefracing.ru'::TEXT,
                'ул. Ватутина 107 (ТЦ Мега)'::TEXT,
                7::SMALLINT,
                'Ковалев'::VARCHAR,
                'Денис'::VARCHAR,
                'Сергеевич'::VARCHAR,
                '+7-383-555-11-00'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_novosibirsk_id,
                'AndefRacing Новосибирск ТЦ Сибирский Молл'::VARCHAR(100),
                '+7-383-200-90-03'::VARCHAR(16),
                'sibmall_nsk@andefracing.ru'::TEXT,
                'Красный просп. 101 (ТЦ Сибирский Молл)'::TEXT,
                6::SMALLINT,
                'Ковалев'::VARCHAR,
                'Денис'::VARCHAR,
                'Сергеевич'::VARCHAR,
                '+7-383-555-11-00'::VARCHAR
                );
    END
$$;

-- Добавление региона "Краснодарский край"
DO
$$
    DECLARE
        v_region_id    SMALLINT;
        v_krasnodar_id SMALLINT;
        v_sochi_id     SMALLINT;
    BEGIN
        v_region_id := admin_management.add_region('Краснодарский край');
        v_krasnodar_id := admin_management.add_city(v_region_id, 'Краснодар');
        v_sochi_id := admin_management.add_city(v_region_id, 'Сочи');

        -- Для Краснодара
        PERFORM admin_management.add_club(
                v_krasnodar_id,
                'AndefRacing Краснодар ТЦ Галерея Краснодар'::VARCHAR(100),
                '+7-861-200-10-01'::VARCHAR(16),
                'gallery_krasnodar@andefracing.ru'::TEXT,
                'ул. Уральская 98/11 (ТЦ Галерея Краснодар)'::TEXT,
                8::SMALLINT,
                'Кравченко'::VARCHAR,
                'Виктор'::VARCHAR,
                'Анатольевич'::VARCHAR,
                '+7-861-555-22-11'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_krasnodar_id,
                'AndefRacing Краснодар ТЦ Мега'::VARCHAR(100),
                '+7-861-200-10-02'::VARCHAR(16),
                'mega_krasnodar@andefracing.ru'::TEXT,
                'ул. Крылатая 2 (ТЦ Мега)'::TEXT,
                7::SMALLINT,
                'Кравченко'::VARCHAR,
                'Виктор'::VARCHAR,
                'Анатольевич'::VARCHAR,
                '+7-861-555-22-11'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_krasnodar_id,
                'AndefRacing Краснодар ТЦ Красная Площадь'::VARCHAR(100),
                '+7-861-200-10-03'::VARCHAR(16),
                'redplaza_krasnodar@andefracing.ru'::TEXT,
                'ул. Дзержинского 100 (ТЦ Красная Площадь)'::TEXT,
                6::SMALLINT,
                'Кравченко'::VARCHAR,
                'Виктор'::VARCHAR,
                'Анатольевич'::VARCHAR,
                '+7-861-555-22-11'::VARCHAR
                );

        -- Для Сочи
        PERFORM admin_management.add_club(
                v_sochi_id,
                'AndefRacing Сочи ТЦ Моремолл'::VARCHAR(100),
                '+7-862-200-11-01'::VARCHAR(16),
                'moremall_sochi@andefracing.ru'::TEXT,
                'ул. Новая Заря 7 (ТЦ Моремолл)'::TEXT,
                5::SMALLINT,
                'Петросян'::VARCHAR,
                'Арам'::VARCHAR,
                'Гарегинович'::VARCHAR,
                '+7-862-555-33-22'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_sochi_id,
                'AndefRacing Сочи ТЦ Александрия'::VARCHAR(100),
                '+7-862-200-11-02'::VARCHAR(16),
                'alexandria_sochi@andefracing.ru'::TEXT,
                'Курортный просп. 120 (ТЦ Александрия)'::TEXT,
                6::SMALLINT,
                'Петросян'::VARCHAR,
                'Арам'::VARCHAR,
                'Гарегинович'::VARCHAR,
                '+7-862-555-33-22'::VARCHAR
                );
    END
$$;

-- Добавление региона "Ростовская область"
DO
$$
    DECLARE
        v_region_id       SMALLINT;
        v_rostov_id       SMALLINT;
    BEGIN
        v_region_id := admin_management.add_region('Ростовская область');
        v_rostov_id := admin_management.add_city(v_region_id, 'Ростов-на-Дону');

        -- Для Ростова-на-Дону
        PERFORM admin_management.add_club(
                v_rostov_id,
                'AndefRacing Ростов-на-Дону ТЦ Горизонт'::VARCHAR(100),
                '+7-863-200-12-01'::VARCHAR(16),
                'gorizont_rostov@andefracing.ru'::TEXT,
                'просп. Михаила Нагибина 32/2 (ТЦ Горизонт)'::TEXT,
                8::SMALLINT,
                'Шевченко'::VARCHAR,
                'Олег'::VARCHAR,
                'Николаевич'::VARCHAR,
                '+7-863-555-44-33'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_rostov_id,
                'AndefRacing Ростов-на-Дону ТЦ Мега'::VARCHAR(100),
                '+7-863-200-12-02'::VARCHAR(16),
                'mega_rostov@andefracing.ru'::TEXT,
                'ул. Лавочкина 34 (ТЦ Мега)'::TEXT,
                7::SMALLINT,
                'Шевченко'::VARCHAR,
                'Олег'::VARCHAR,
                'Николаевич'::VARCHAR,
                '+7-863-555-44-33'::VARCHAR
                );
        PERFORM admin_management.add_club(
                v_rostov_id,
                'AndefRacing Ростов-на-Дону ТЦ Золотой Вавилон'::VARCHAR(100),
                '+7-863-200-12-03'::VARCHAR(16),
                'babylon_rostov@andefracing.ru'::TEXT,
                'ул. Текучева 234 (ТЦ Золотой Вавилон)'::TEXT,
                6::SMALLINT,
                'Шевченко'::VARCHAR,
                'Олег'::VARCHAR,
                'Николаевич'::VARCHAR,
                '+7-863-555-44-33'::VARCHAR
                );
    END
$$;


--------------------------------------------------------------------------------------------
-- Добавление фотографий для новых клубов
--------------------------------------------------------------------------------------------
-- Фотографии для клуба "AndefRacing Казань ТЦ Кольцо" (club_id = 7)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (7, '/files/clubs/7/кольцо_клуб.jpg', 1),
       (7, '/files/clubs/7/кольцо_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Казань ТЦ Мега" (club_id = 8)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (8, '/files/clubs/8/мега_казань_клуб.jpg', 1),
       (8, '/files/clubs/8/мега_казань_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Казань ТЦ Южный" (club_id = 9)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (9, '/files/clubs/9/южный_клуб.jpg', 1),
       (9, '/files/clubs/9/южный_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Набережные Челны ТЦ Торговый Квартал" (club_id = 10)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (10, '/files/clubs/10/торговый_квартал_клуб.jpg', 1),
       (10, '/files/clubs/10/торговый_квартал_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Набережные Челны ТЦ Эссен" (club_id = 11)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (11, '/files/clubs/11/эссен_клуб.jpg', 1),
       (11, '/files/clubs/11/эссен_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Уфа ТЦ Планета" (club_id = 12)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (12, '/files/clubs/12/планета_клуб.jpg', 1),
       (12, '/files/clubs/12/планета_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Уфа ТЦ Мега" (club_id = 13)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (13, '/files/clubs/13/мега_уфа_клуб.jpg', 1),
       (13, '/files/clubs/13/мега_уфа_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Екатеринбург ТЦ Гринвич" (club_id = 14)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (14, '/files/clubs/14/гринвич_клуб.jpg', 1),
       (14, '/files/clubs/14/гринвич_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Екатеринбург ТЦ Алатырь" (club_id = 15)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (15, '/files/clubs/15/алатырь_клуб.jpg', 1),
       (15, '/files/clubs/15/алатырь_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Екатеринбург ТЦ Мега" (club_id = 16)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (16, '/files/clubs/16/мега_екб_клуб.jpg', 1),
       (16, '/files/clubs/16/мега_екб_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Новосибирск ТЦ Аура" (club_id = 17)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (17, '/files/clubs/17/аура_клуб.jpg', 1),
       (17, '/files/clubs/17/аура_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Новосибирск ТЦ Мега" (club_id = 18)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (18, '/files/clubs/18/мега_нск_клуб.jpg', 1),
       (18, '/files/clubs/18/мега_нск_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Новосибирск ТЦ Сибирский Молл" (club_id = 19)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (19, '/files/clubs/19/сибирский_молл_клуб.jpg', 1),
       (19, '/files/clubs/19/сибирский_молл_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Краснодар ТЦ Галерея Краснодар" (club_id = 20)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (20, '/files/clubs/20/галерея_клуб.jpg', 1),
       (20, '/files/clubs/20/галерея_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Краснодар ТЦ Мега" (club_id = 21)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (21, '/files/clubs/21/мега_краснодар_клуб.jpg', 1),
       (21, '/files/clubs/21/мега_краснодар_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Краснодар ТЦ Красная Площадь" (club_id = 22)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (22, '/files/clubs/22/красная_площадь_клуб.jpg', 1),
       (22, '/files/clubs/22/красная_площадь_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Сочи ТЦ Моремолл" (club_id = 23)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (23, '/files/clubs/23/моремолл_клуб.jpg', 1),
       (23, '/files/clubs/23/моремолл_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Сочи ТЦ Александрия" (club_id = 24)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (24, '/files/clubs/24/александрия_клуб.jpg', 1),
       (24, '/files/clubs/24/александрия_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Ростов-на-Дону ТЦ Горизонт" (club_id = 25)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (25, '/files/clubs/25/горизонт_клуб.jpg', 1),
       (25, '/files/clubs/25/горизонт_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Ростов-на-Дону ТЦ Мега" (club_id = 26)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (26, '/files/clubs/26/мега_ростов_клуб.jpg', 1),
       (26, '/files/clubs/26/мега_ростов_тц.jpg', 2);

-- Фотографии для клуба "AndefRacing Ростов-на-Дону ТЦ Золотой Вавилон" (club_id = 27)
INSERT INTO info.photo (club_id, url, sequence_number)
VALUES (27, '/files/clubs/27/золотой_вавилон_клуб.jpg', 1),
       (27, '/files/clubs/27/золотой_вавилон_тц.jpg', 2);


--------------------------------------------------------------------------------------------
-- Добавление цен для новых клубов
--------------------------------------------------------------------------------------------
-- Цены для клубов Казани (club_id = 7, 8, 9) - крупный город, цены выше
-- Клуб "AndefRacing Казань ТЦ Кольцо" (club_id = 7)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (7, 15, 400.00),
       (7, 30, 550.00),
       (7, 60, 750.00),
       (7, 90, 1100.00),
       (7, 120, 1450.00),
       (7, 150, 1800.00),
       (7, 180, 2150.00),
       (7, 210, 2500.00),
       (7, 240, 2850.00);

-- Клуб "AndefRacing Казань ТЦ Мега" (club_id = 8)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (8, 15, 400.00),
       (8, 30, 550.00),
       (8, 60, 750.00),
       (8, 90, 1100.00),
       (8, 120, 1450.00),
       (8, 150, 1800.00),
       (8, 180, 2150.00),
       (8, 210, 2500.00),
       (8, 240, 2850.00);

-- Клуб "AndefRacing Казань ТЦ Южный" (club_id = 9)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (9, 15, 400.00),
       (9, 30, 550.00),
       (9, 60, 750.00),
       (9, 90, 1100.00),
       (9, 120, 1450.00),
       (9, 150, 1800.00),
       (9, 180, 2150.00),
       (9, 210, 2500.00),
       (9, 240, 2850.00);

-- Цены для клубов Набережных Челнов (club_id = 10, 11) - региональные цены
-- Клуб "AndefRacing Набережные Челны ТЦ Торговый Квартал" (club_id = 10)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (10, 15, 300.00),
       (10, 30, 450.00),
       (10, 60, 650.00),
       (10, 90, 1000.00),
       (10, 120, 1350.00),
       (10, 150, 1700.00),
       (10, 180, 2050.00),
       (10, 210, 2400.00),
       (10, 240, 2750.00);

-- Клуб "AndefRacing Набережные Челны ТЦ Эссен" (club_id = 11)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (11, 15, 300.00),
       (11, 30, 450.00),
       (11, 60, 650.00),
       (11, 90, 1000.00),
       (11, 120, 1350.00),
       (11, 150, 1700.00),
       (11, 180, 2050.00),
       (11, 210, 2400.00),
       (11, 240, 2750.00);

-- Цены для клубов Уфы (club_id = 12, 13) - крупный город
-- Клуб "AndefRacing Уфа ТЦ Планета" (club_id = 12)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (12, 15, 350.00),
       (12, 30, 500.00),
       (12, 60, 700.00),
       (12, 90, 1050.00),
       (12, 120, 1400.00),
       (12, 150, 1750.00),
       (12, 180, 2100.00),
       (12, 210, 2450.00),
       (12, 240, 2800.00);

-- Клуб "AndefRacing Уфа ТЦ Мега" (club_id = 13)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (13, 15, 350.00),
       (13, 30, 500.00),
       (13, 60, 700.00),
       (13, 90, 1050.00),
       (13, 120, 1400.00),
       (13, 150, 1750.00),
       (13, 180, 2100.00),
       (13, 210, 2450.00),
       (13, 240, 2800.00);

-- Цены для клубов Екатеринбурга (club_id = 14, 15, 16) - крупный город, цены выше
-- Клуб "AndefRacing Екатеринбург ТЦ Гринвич" (club_id = 14)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (14, 15, 400.00),
       (14, 30, 550.00),
       (14, 60, 750.00),
       (14, 90, 1100.00),
       (14, 120, 1450.00),
       (14, 150, 1800.00),
       (14, 180, 2150.00),
       (14, 210, 2500.00),
       (14, 240, 2850.00);

-- Клуб "AndefRacing Екатеринбург ТЦ Алатырь" (club_id = 15)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (15, 15, 400.00),
       (15, 30, 550.00),
       (15, 60, 750.00),
       (15, 90, 1100.00),
       (15, 120, 1450.00),
       (15, 150, 1800.00),
       (15, 180, 2150.00),
       (15, 210, 2500.00),
       (15, 240, 2850.00);

-- Клуб "AndefRacing Екатеринбург ТЦ Мега" (club_id = 16)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (16, 15, 400.00),
       (16, 30, 550.00),
       (16, 60, 750.00),
       (16, 90, 1100.00),
       (16, 120, 1450.00),
       (16, 150, 1800.00),
       (16, 180, 2150.00),
       (16, 210, 2500.00),
       (16, 240, 2850.00);

-- Цены для клубов Новосибирска (club_id = 17, 18, 19) - крупный город, цены выше
-- Клуб "AndefRacing Новосибирск ТЦ Аура" (club_id = 17)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (17, 15, 400.00),
       (17, 30, 550.00),
       (17, 60, 750.00),
       (17, 90, 1100.00),
       (17, 120, 1450.00),
       (17, 150, 1800.00),
       (17, 180, 2150.00),
       (17, 210, 2500.00),
       (17, 240, 2850.00);

-- Клуб "AndefRacing Новосибирск ТЦ Мега" (club_id = 18)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (18, 15, 400.00),
       (18, 30, 550.00),
       (18, 60, 750.00),
       (18, 90, 1100.00),
       (18, 120, 1450.00),
       (18, 150, 1800.00),
       (18, 180, 2150.00),
       (18, 210, 2500.00),
       (18, 240, 2850.00);

-- Клуб "AndefRacing Новосибирск ТЦ Сибирский Молл" (club_id = 19)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (19, 15, 400.00),
       (19, 30, 550.00),
       (19, 60, 750.00),
       (19, 90, 1100.00),
       (19, 120, 1450.00),
       (19, 150, 1800.00),
       (19, 180, 2150.00),
       (19, 210, 2500.00),
       (19, 240, 2850.00);

-- Цены для клубов Краснодара (club_id = 20, 21, 22) - крупный город, цены выше
-- Клуб "AndefRacing Краснодар ТЦ Галерея Краснодар" (club_id = 20)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (20, 15, 400.00),
       (20, 30, 550.00),
       (20, 60, 750.00),
       (20, 90, 1100.00),
       (20, 120, 1450.00),
       (20, 150, 1800.00),
       (20, 180, 2150.00),
       (20, 210, 2500.00),
       (20, 240, 2850.00);

-- Клуб "AndefRacing Краснодар ТЦ Мега" (club_id = 21)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (21, 15, 400.00),
       (21, 30, 550.00),
       (21, 60, 750.00),
       (21, 90, 1100.00),
       (21, 120, 1450.00),
       (21, 150, 1800.00),
       (21, 180, 2150.00),
       (21, 210, 2500.00),
       (21, 240, 2850.00);

-- Клуб "AndefRacing Краснодар ТЦ Красная Площадь" (club_id = 22)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (22, 15, 400.00),
       (22, 30, 550.00),
       (22, 60, 750.00),
       (22, 90, 1100.00),
       (22, 120, 1450.00),
       (22, 150, 1800.00),
       (22, 180, 2150.00),
       (22, 210, 2500.00),
       (22, 240, 2850.00);

-- Цены для клубов Сочи (club_id = 23, 24) - курортный город, цены выше
-- Клуб "AndefRacing Сочи ТЦ Моремолл" (club_id = 23)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (23, 15, 450.00),
       (23, 30, 600.00),
       (23, 60, 800.00),
       (23, 90, 1150.00),
       (23, 120, 1500.00),
       (23, 150, 1850.00),
       (23, 180, 2200.00),
       (23, 210, 2550.00),
       (23, 240, 2900.00);

-- Клуб "AndefRacing Сочи ТЦ Александрия" (club_id = 24)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (24, 15, 450.00),
       (24, 30, 600.00),
       (24, 60, 800.00),
       (24, 90, 1150.00),
       (24, 120, 1500.00),
       (24, 150, 1850.00),
       (24, 180, 2200.00),
       (24, 210, 2550.00),
       (24, 240, 2900.00);

-- Цены для клубов Ростова-на-Дону (club_id = 25, 26, 27) - крупный город, цены выше
-- Клуб "AndefRacing Ростов-на-Дону ТЦ Горизонт" (club_id = 25)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (25, 15, 400.00),
       (25, 30, 550.00),
       (25, 60, 750.00),
       (25, 90, 1100.00),
       (25, 120, 1450.00),
       (25, 150, 1800.00),
       (25, 180, 2150.00),
       (25, 210, 2500.00),
       (25, 240, 2850.00);

-- Клуб "AndefRacing Ростов-на-Дону ТЦ Мега" (club_id = 26)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (26, 15, 400.00),
       (26, 30, 550.00),
       (26, 60, 750.00),
       (26, 90, 1100.00),
       (26, 120, 1450.00),
       (26, 150, 1800.00),
       (26, 180, 2150.00),
       (26, 210, 2500.00),
       (26, 240, 2850.00);

-- Клуб "AndefRacing Ростов-на-Дону ТЦ Золотой Вавилон" (club_id = 27)
INSERT INTO info.price (club_id, duration_minutes, price_value)
VALUES (27, 15, 400.00),
       (27, 30, 550.00),
       (27, 60, 750.00),
       (27, 90, 1100.00),
       (27, 120, 1450.00),
       (27, 150, 1800.00),
       (27, 180, 2150.00),
       (27, 210, 2500.00),
       (27, 240, 2850.00);


--------------------------------------------------------------------------------------------
-- Добавление игр в новые клубы
--------------------------------------------------------------------------------------------
-- Добавляем все игры во все новые клубы
-- Клуб "AndefRacing Казань ТЦ Кольцо" (club_id = 7)
INSERT INTO info.game_club (club_id, game_id)
VALUES (7, 1), -- Assetto Corsa Competizione
       (7, 2), -- Assetto Corsa Evo
       (7, 3), -- BeamNG.drive
       (7, 4), -- CarX
       (7, 5), -- R2
       (7, 6); -- W2S

-- Клуб "AndefRacing Казань ТЦ Мега" (club_id = 8)
INSERT INTO info.game_club (club_id, game_id)
VALUES (8, 1), -- Assetto Corsa Competizione
       (8, 2), -- Assetto Corsa Evo
       (8, 3), -- BeamNG.drive
       (8, 4), -- CarX
       (8, 5), -- R2
       (8, 6); -- W2S

-- Клуб "AndefRacing Казань ТЦ Южный" (club_id = 9)
INSERT INTO info.game_club (club_id, game_id)
VALUES (9, 1), -- Assetto Corsa Competizione
       (9, 2), -- Assetto Corsa Evo
       (9, 3), -- BeamNG.drive
       (9, 4), -- CarX
       (9, 5), -- R2
       (9, 6); -- W2S

-- Клуб "AndefRacing Набережные Челны ТЦ Торговый Квартал" (club_id = 10)
INSERT INTO info.game_club (club_id, game_id)
VALUES (10, 1), -- Assetto Corsa Competizione
       (10, 2), -- Assetto Corsa Evo
       (10, 3), -- BeamNG.drive
       (10, 4), -- CarX
       (10, 5), -- R2
       (10, 6); -- W2S

-- Клуб "AndefRacing Набережные Челны ТЦ Эссен" (club_id = 11)
INSERT INTO info.game_club (club_id, game_id)
VALUES (11, 1), -- Assetto Corsa Competizione
       (11, 2), -- Assetto Corsa Evo
       (11, 3), -- BeamNG.drive
       (11, 4), -- CarX
       (11, 5), -- R2
       (11, 6); -- W2S

-- Клуб "AndefRacing Уфа ТЦ Планета" (club_id = 12)
INSERT INTO info.game_club (club_id, game_id)
VALUES (12, 1), -- Assetto Corsa Competizione
       (12, 2), -- Assetto Corsa Evo
       (12, 3), -- BeamNG.drive
       (12, 4), -- CarX
       (12, 5), -- R2
       (12, 6); -- W2S

-- Клуб "AndefRacing Уфа ТЦ Мега" (club_id = 13)
INSERT INTO info.game_club (club_id, game_id)
VALUES (13, 1), -- Assetto Corsa Competizione
       (13, 2), -- Assetto Corsa Evo
       (13, 3), -- BeamNG.drive
       (13, 4), -- CarX
       (13, 5), -- R2
       (13, 6); -- W2S

-- Клуб "AndefRacing Екатеринбург ТЦ Гринвич" (club_id = 14)
INSERT INTO info.game_club (club_id, game_id)
VALUES (14, 1), -- Assetto Corsa Competizione
       (14, 2), -- Assetto Corsa Evo
       (14, 3), -- BeamNG.drive
       (14, 4), -- CarX
       (14, 5), -- R2
       (14, 6); -- W2S

-- Клуб "AndefRacing Екатеринбург ТЦ Алатырь" (club_id = 15)
INSERT INTO info.game_club (club_id, game_id)
VALUES (15, 1), -- Assetto Corsa Competizione
       (15, 2), -- Assetto Corsa Evo
       (15, 3), -- BeamNG.drive
       (15, 4), -- CarX
       (15, 5), -- R2
       (15, 6); -- W2S

-- Клуб "AndefRacing Екатеринбург ТЦ Мега" (club_id = 16)
INSERT INTO info.game_club (club_id, game_id)
VALUES (16, 1), -- Assetto Corsa Competizione
       (16, 2), -- Assetto Corsa Evo
       (16, 3), -- BeamNG.drive
       (16, 4), -- CarX
       (16, 5), -- R2
       (16, 6); -- W2S

-- Клуб "AndefRacing Новосибирск ТЦ Аура" (club_id = 17)
INSERT INTO info.game_club (club_id, game_id)
VALUES (17, 1), -- Assetto Corsa Competizione
       (17, 2), -- Assetto Corsa Evo
       (17, 3), -- BeamNG.drive
       (17, 4), -- CarX
       (17, 5), -- R2
       (17, 6); -- W2S

-- Клуб "AndefRacing Новосибирск ТЦ Мега" (club_id = 18)
INSERT INTO info.game_club (club_id, game_id)
VALUES (18, 1), -- Assetto Corsa Competizione
       (18, 2), -- Assetto Corsa Evo
       (18, 3), -- BeamNG.drive
       (18, 4), -- CarX
       (18, 5), -- R2
       (18, 6); -- W2S

-- Клуб "AndefRacing Новосибирск ТЦ Сибирский Молл" (club_id = 19)
INSERT INTO info.game_club (club_id, game_id)
VALUES (19, 1), -- Assetto Corsa Competizione
       (19, 2), -- Assetto Corsa Evo
       (19, 3), -- BeamNG.drive
       (19, 4), -- CarX
       (19, 5), -- R2
       (19, 6); -- W2S

-- Клуб "AndefRacing Краснодар ТЦ Галерея Краснодар" (club_id = 20)
INSERT INTO info.game_club (club_id, game_id)
VALUES (20, 1), -- Assetto Corsa Competizione
       (20, 2), -- Assetto Corsa Evo
       (20, 3), -- BeamNG.drive
       (20, 4), -- CarX
       (20, 5), -- R2
       (20, 6); -- W2S

-- Клуб "AndefRacing Краснодар ТЦ Мега" (club_id = 21)
INSERT INTO info.game_club (club_id, game_id)
VALUES (21, 1), -- Assetto Corsa Competizione
       (21, 2), -- Assetto Corsa Evo
       (21, 3), -- BeamNG.drive
       (21, 4), -- CarX
       (21, 5), -- R2
       (21, 6); -- W2S

-- Клуб "AndefRacing Краснодар ТЦ Красная Площадь" (club_id = 22)
INSERT INTO info.game_club (club_id, game_id)
VALUES (22, 1), -- Assetto Corsa Competizione
       (22, 2), -- Assetto Corsa Evo
       (22, 3), -- BeamNG.drive
       (22, 4), -- CarX
       (22, 5), -- R2
       (22, 6); -- W2S

-- Клуб "AndefRacing Сочи ТЦ Моремолл" (club_id = 23)
INSERT INTO info.game_club (club_id, game_id)
VALUES (23, 1), -- Assetto Corsa Competizione
       (23, 2), -- Assetto Corsa Evo
       (23, 3), -- BeamNG.drive
       (23, 4), -- CarX
       (23, 5), -- R2
       (23, 6); -- W2S

-- Клуб "AndefRacing Сочи ТЦ Александрия" (club_id = 24)
INSERT INTO info.game_club (club_id, game_id)
VALUES (24, 1), -- Assetto Corsa Competizione
       (24, 2), -- Assetto Corsa Evo
       (24, 3), -- BeamNG.drive
       (24, 4), -- CarX
       (24, 5), -- R2
       (24, 6); -- W2S

-- Клуб "AndefRacing Ростов-на-Дону ТЦ Горизонт" (club_id = 25)
INSERT INTO info.game_club (club_id, game_id)
VALUES (25, 1), -- Assetto Corsa Competizione
       (25, 2), -- Assetto Corsa Evo
       (25, 3), -- BeamNG.drive
       (25, 4), -- CarX
       (25, 5), -- R2
       (25, 6); -- W2S

-- Клуб "AndefRacing Ростов-на-Дону ТЦ Мега" (club_id = 26)
INSERT INTO info.game_club (club_id, game_id)
VALUES (26, 1), -- Assetto Corsa Competizione
       (26, 2), -- Assetto Corsa Evo
       (26, 3), -- BeamNG.drive
       (26, 4), -- CarX
       (26, 5), -- R2
       (26, 6); -- W2S

-- Клуб "AndefRacing Ростов-на-Дону ТЦ Золотой Вавилон" (club_id = 27)
INSERT INTO info.game_club (club_id, game_id)
VALUES (27, 1), -- Assetto Corsa Competizione
       (27, 2), -- Assetto Corsa Evo
       (27, 3), -- BeamNG.drive
       (27, 4), -- CarX
       (27, 5), -- R2
       (27, 6); -- W2S


--------------------------------------------------------------------------------------------
-- Добавление сотрудников в новые клубы
--------------------------------------------------------------------------------------------
-- Сотрудники для клуба "AndefRacing Казань ТЦ Кольцо" (club_id = 7)
-- Управляющий уже добавлен при создании клуба (employee_id = 29)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Хамидуллин', 'Тимур', 'Рустамович', '+7-843-123-45-67', NULL, TRUE, FALSE),
       ('Сафина', 'Алсу', 'Маратовна', '+7-843-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 30, 31)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (7, 30, 'EMPLOYEE'),
       (7, 30, 'ADMIN'),
       (7, 31, 'EMPLOYEE'),
       (7, 31, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Галиев', 'Ринат', 'Ильдарович', '+7-843-345-67-89', NULL, TRUE, FALSE),
       ('Нуриева', 'Диана', 'Рафаэльевна', '+7-843-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 32, 33)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (7, 32, 'EMPLOYEE'),
       (7, 33, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Казань ТЦ Мега" (club_id = 8)
-- Управляющий тот же (employee_id = 29)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Закиров', 'Камиль', 'Азатович', '+7-843-567-89-01', NULL, TRUE, FALSE),
       ('Мухаметова', 'Лейла', 'Ильнуровна', '+7-843-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 34, 35)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (8, 34, 'EMPLOYEE'),
       (8, 34, 'ADMIN'),
       (8, 35, 'EMPLOYEE'),
       (8, 35, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Ахметов', 'Булат', 'Рамилевич', '+7-843-789-01-23', NULL, TRUE, FALSE),
       ('Шарипова', 'Гульнара', 'Фаридовна', '+7-843-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 36, 37)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (8, 36, 'EMPLOYEE'),
       (8, 37, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Казань ТЦ Южный" (club_id = 9)
-- Управляющий тот же (employee_id = 29)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Валиуллин', 'Марат', 'Наилевич', '+7-843-901-23-45', NULL, TRUE, FALSE),
       ('Латыпова', 'Зарина', 'Ринатовна', '+7-843-012-34-56', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 38, 39)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (9, 38, 'EMPLOYEE'),
       (9, 38, 'ADMIN'),
       (9, 39, 'EMPLOYEE'),
       (9, 39, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Сабиров', 'Данил', 'Маратович', '+7-843-123-45-00', NULL, TRUE, FALSE),
       ('Хасанова', 'Регина', 'Ильдаровна', '+7-843-234-56-11', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 40, 41)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (9, 40, 'EMPLOYEE'),
       (9, 41, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Набережные Челны ТЦ Торговый Квартал" (club_id = 10)
-- Управляющий уже добавлен при создании клуба (employee_id = 42)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Фаттахов', 'Айдар', 'Рустемович', '+7-855-123-45-67', NULL, TRUE, FALSE),
       ('Гарипова', 'Лилия', 'Маратовна', '+7-855-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 43, 44)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (10, 43, 'EMPLOYEE'),
       (10, 43, 'ADMIN'),
       (10, 44, 'EMPLOYEE'),
       (10, 44, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Нургалиев', 'Радик', 'Ильнурович', '+7-855-345-67-89', NULL, TRUE, FALSE),
       ('Ибрагимова', 'Алина', 'Рафаэльевна', '+7-855-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 45, 46)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (10, 45, 'EMPLOYEE'),
       (10, 46, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Набережные Челны ТЦ Эссен" (club_id = 11)
-- Управляющий тот же (employee_id = 42)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Шакиров', 'Ильнур', 'Азатович', '+7-855-567-89-01', NULL, TRUE, FALSE),
       ('Минуллина', 'Камила', 'Рустамовна', '+7-855-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 47, 48)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (11, 47, 'EMPLOYEE'),
       (11, 47, 'ADMIN'),
       (11, 48, 'EMPLOYEE'),
       (11, 48, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Юсупов', 'Тимур', 'Маратович', '+7-855-789-01-23', NULL, TRUE, FALSE),
       ('Сулейманова', 'Эльвира', 'Ильдаровна', '+7-855-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 49, 50)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (11, 49, 'EMPLOYEE'),
       (11, 50, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Уфа ТЦ Планета" (club_id = 12)
-- Управляющий уже добавлен при создании клуба (employee_id = 51)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Гайнуллин', 'Рустем', 'Рашидович', '+7-347-123-45-67', NULL, TRUE, FALSE),
       ('Хабибуллина', 'Алия', 'Маратовна', '+7-347-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 52, 53)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (12, 52, 'EMPLOYEE'),
       (12, 52, 'ADMIN'),
       (12, 53, 'EMPLOYEE'),
       (12, 53, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Мустафин', 'Ильдар', 'Рафаэльевич', '+7-347-345-67-89', NULL, TRUE, FALSE),
       ('Сагитова', 'Динара', 'Ринатовна', '+7-347-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 54, 55)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (12, 54, 'EMPLOYEE'),
       (12, 55, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Уфа ТЦ Мега" (club_id = 13)
-- Управляющий тот же (employee_id = 51)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Бикбулатов', 'Азат', 'Ильнурович', '+7-347-567-89-01', NULL, TRUE, FALSE),
       ('Янбаева', 'Лилия', 'Рустамовна', '+7-347-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 56, 57)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (13, 56, 'EMPLOYEE'),
       (13, 56, 'ADMIN'),
       (13, 57, 'EMPLOYEE'),
       (13, 57, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Хусаинов', 'Марат', 'Рафаэльевич', '+7-347-789-01-23', NULL, TRUE, FALSE),
       ('Фазлыева', 'Гузель', 'Ильдаровна', '+7-347-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 58, 59)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (13, 58, 'EMPLOYEE'),
       (13, 59, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Екатеринбург ТЦ Гринвич" (club_id = 14)
-- Управляющий уже добавлен при создании клуба (employee_id = 60)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Попов', 'Кирилл', 'Александрович', '+7-343-123-45-67', NULL, TRUE, FALSE),
       ('Белоусова', 'Дарья', 'Сергеевна', '+7-343-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 61, 62)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (14, 61, 'EMPLOYEE'),
       (14, 61, 'ADMIN'),
       (14, 62, 'EMPLOYEE'),
       (14, 62, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Зайцев', 'Роман', 'Владимирович', '+7-343-345-67-89', NULL, TRUE, FALSE),
       ('Крылова', 'Полина', 'Игоревна', '+7-343-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 63, 64)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (14, 63, 'EMPLOYEE'),
       (14, 64, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Екатеринбург ТЦ Алатырь" (club_id = 15)
-- Управляющий тот же (employee_id = 60)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Медведев', 'Станислав', 'Петрович', '+7-343-567-89-01', NULL, TRUE, FALSE),
       ('Фролова', 'Анастасия', 'Дмитриевна', '+7-343-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 65, 66)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (15, 65, 'EMPLOYEE'),
       (15, 65, 'ADMIN'),
       (15, 66, 'EMPLOYEE'),
       (15, 66, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Тихонов', 'Глеб', 'Андреевич', '+7-343-789-01-23', NULL, TRUE, FALSE),
       ('Соколова', 'Вероника', 'Алексеевна', '+7-343-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 67, 68)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (15, 67, 'EMPLOYEE'),
       (15, 68, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Екатеринбург ТЦ Мега" (club_id = 16)
-- Управляющий тот же (employee_id = 60)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Лебедев', 'Максим', 'Николаевич', '+7-343-901-23-45', NULL, TRUE, FALSE),
       ('Антонова', 'Ксения', 'Викторовна', '+7-343-012-34-56', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 69, 70)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (16, 69, 'EMPLOYEE'),
       (16, 69, 'ADMIN'),
       (16, 70, 'EMPLOYEE'),
       (16, 70, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Воробьев', 'Артур', 'Сергеевич', '+7-343-123-45-00', NULL, TRUE, FALSE),
       ('Никитина', 'Алена', 'Павловна', '+7-343-234-56-11', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 71, 72)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (16, 71, 'EMPLOYEE'),
       (16, 72, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Новосибирск ТЦ Аура" (club_id = 17)
-- Управляющий уже добавлен при создании клуба (employee_id = 73)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Козлов', 'Владислав', 'Игоревич', '+7-383-123-45-67', NULL, TRUE, FALSE),
       ('Морозова', 'Виктория', 'Андреевна', '+7-383-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 74, 75)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (17, 74, 'EMPLOYEE'),
       (17, 74, 'ADMIN'),
       (17, 75, 'EMPLOYEE'),
       (17, 75, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Павлов', 'Егор', 'Дмитриевич', '+7-383-345-67-89', NULL, TRUE, FALSE),
       ('Новикова', 'Милана', 'Сергеевна', '+7-383-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 76, 77)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (17, 76, 'EMPLOYEE'),
       (17, 77, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Новосибирск ТЦ Мега" (club_id = 18)
-- Управляющий тот же (employee_id = 73)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Волков', 'Илья', 'Александрович', '+7-383-567-89-01', NULL, TRUE, FALSE),
       ('Семенова', 'Арина', 'Владимировна', '+7-383-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 78, 79)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (18, 78, 'EMPLOYEE'),
       (18, 78, 'ADMIN'),
       (18, 79, 'EMPLOYEE'),
       (18, 79, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Андреев', 'Матвей', 'Николаевич', '+7-383-789-01-23', NULL, TRUE, FALSE),
       ('Кузнецова', 'София', 'Игоревна', '+7-383-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 80, 81)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (18, 80, 'EMPLOYEE'),
       (18, 81, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Новосибирск ТЦ Сибирский Молл" (club_id = 19)
-- Управляющий тот же (employee_id = 73)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Егоров', 'Даниил', 'Петрович', '+7-383-901-23-45', NULL, TRUE, FALSE),
       ('Федорова', 'Елизавета', 'Дмитриевна', '+7-383-012-34-56', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 82, 83)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (19, 82, 'EMPLOYEE'),
       (19, 82, 'ADMIN'),
       (19, 83, 'EMPLOYEE'),
       (19, 83, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Макаров', 'Тимофей', 'Андреевич', '+7-383-123-45-00', NULL, TRUE, FALSE),
       ('Васильева', 'Мария', 'Сергеевна', '+7-383-234-56-11', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 84, 85)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (19, 84, 'EMPLOYEE'),
       (19, 85, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Краснодар ТЦ Галерея Краснодар" (club_id = 20)
-- Управляющий уже добавлен при создании клуба (employee_id = 86)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Ткаченко', 'Богдан', 'Викторович', '+7-861-123-45-67', NULL, TRUE, FALSE),
       ('Коваленко', 'Анна', 'Александровна', '+7-861-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 87, 88)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (20, 87, 'EMPLOYEE'),
       (20, 87, 'ADMIN'),
       (20, 88, 'EMPLOYEE'),
       (20, 88, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Бондаренко', 'Артем', 'Николаевич', '+7-861-345-67-89', NULL, TRUE, FALSE),
       ('Мельник', 'Екатерина', 'Сергеевна', '+7-861-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 89, 90)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (20, 89, 'EMPLOYEE'),
       (20, 90, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Краснодар ТЦ Мега" (club_id = 21)
-- Управляющий тот же (employee_id = 86)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Савченко', 'Владимир', 'Петрович', '+7-861-567-89-01', NULL, TRUE, FALSE),
       ('Литвиненко', 'Ольга', 'Игоревна', '+7-861-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 91, 92)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (21, 91, 'EMPLOYEE'),
       (21, 91, 'ADMIN'),
       (21, 92, 'EMPLOYEE'),
       (21, 92, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Гончаренко', 'Максим', 'Андреевич', '+7-861-789-01-23', NULL, TRUE, FALSE),
       ('Павленко', 'Юлия', 'Владимировна', '+7-861-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 93, 94)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (21, 93, 'EMPLOYEE'),
       (21, 94, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Краснодар ТЦ Красная Площадь" (club_id = 22)
-- Управляющий тот же (employee_id = 86)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Шевченко', 'Денис', 'Александрович', '+7-861-901-23-45', NULL, TRUE, FALSE),
       ('Руденко', 'Светлана', 'Николаевна', '+7-861-012-34-56', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 95, 96)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (22, 95, 'EMPLOYEE'),
       (22, 95, 'ADMIN'),
       (22, 96, 'EMPLOYEE'),
       (22, 96, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Кравец', 'Игорь', 'Викторович', '+7-861-123-45-00', NULL, TRUE, FALSE),
       ('Полищук', 'Наталья', 'Петровна', '+7-861-234-56-11', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 97, 98)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (22, 97, 'EMPLOYEE'),
       (22, 98, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Сочи ТЦ Моремолл" (club_id = 23)
-- Управляющий уже добавлен при создании клуба (employee_id = 99)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Григорян', 'Артур', 'Гарегинович', '+7-862-123-45-67', NULL, TRUE, FALSE),
       ('Саркисян', 'Анна', 'Арамовна', '+7-862-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 100, 101)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (23, 100, 'EMPLOYEE'),
       (23, 100, 'ADMIN'),
       (23, 101, 'EMPLOYEE'),
       (23, 101, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Акопян', 'Давид', 'Арменович', '+7-862-345-67-89', NULL, TRUE, FALSE),
       ('Мкртчян', 'Лусине', 'Гарниковна', '+7-862-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 102, 103)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (23, 102, 'EMPLOYEE'),
       (23, 103, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Сочи ТЦ Александрия" (club_id = 24)
-- Управляющий тот же (employee_id = 99)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Оганесян', 'Тигран', 'Вардкесович', '+7-862-567-89-01', NULL, TRUE, FALSE),
       ('Асатрян', 'Мария', 'Арамовна', '+7-862-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 104, 105)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (24, 104, 'EMPLOYEE'),
       (24, 104, 'ADMIN'),
       (24, 105, 'EMPLOYEE'),
       (24, 105, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Багдасарян', 'Арсен', 'Гарегинович', '+7-862-789-01-23', NULL, TRUE, FALSE),
       ('Варданян', 'Нарине', 'Артуровна', '+7-862-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 106, 107)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (24, 106, 'EMPLOYEE'),
       (24, 107, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Ростов-на-Дону ТЦ Горизонт" (club_id = 25)
-- Управляющий уже добавлен при создании клуба (employee_id = 108)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Коваленко', 'Дмитрий', 'Олегович', '+7-863-123-45-67', NULL, TRUE, FALSE),
       ('Бондарь', 'Елена', 'Викторовна', '+7-863-234-56-78', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 109, 110)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (25, 109, 'EMPLOYEE'),
       (25, 109, 'ADMIN'),
       (25, 110, 'EMPLOYEE'),
       (25, 110, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Мороз', 'Андрей', 'Николаевич', '+7-863-345-67-89', NULL, TRUE, FALSE),
       ('Ткач', 'Ирина', 'Александровна', '+7-863-456-78-90', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 111, 112)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (25, 111, 'EMPLOYEE'),
       (25, 112, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Ростов-на-Дону ТЦ Мега" (club_id = 26)
-- Управляющий тот же (employee_id = 108)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Лысенко', 'Сергей', 'Петрович', '+7-863-567-89-01', NULL, TRUE, FALSE),
       ('Гриценко', 'Татьяна', 'Игоревна', '+7-863-678-90-12', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 113, 114)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (26, 113, 'EMPLOYEE'),
       (26, 113, 'ADMIN'),
       (26, 114, 'EMPLOYEE'),
       (26, 114, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Белый', 'Роман', 'Владимирович', '+7-863-789-01-23', NULL, TRUE, FALSE),
       ('Черная', 'Оксана', 'Сергеевна', '+7-863-890-12-34', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 115, 116)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (26, 115, 'EMPLOYEE'),
       (26, 116, 'EMPLOYEE');

-- Сотрудники для клуба "AndefRacing Ростов-на-Дону ТЦ Золотой Вавилон" (club_id = 27)
-- Управляющий тот же (employee_id = 108)
-- Добавляем 2 администраторов
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Ковальчук', 'Виталий', 'Анатольевич', '+7-863-901-23-45', NULL, TRUE, FALSE),
       ('Сидоренко', 'Марина', 'Николаевна', '+7-863-012-34-56', NULL, TRUE, FALSE);

-- Добавляем роли администраторов (employee_id = 117, 118)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (27, 117, 'EMPLOYEE'),
       (27, 117, 'ADMIN'),
       (27, 118, 'EMPLOYEE'),
       (27, 118, 'ADMIN');

-- Добавляем 2 обычных сотрудников
INSERT INTO hr.employee (surname, name, patronymic, phone, password, need_password, is_blocked)
VALUES ('Кравчук', 'Алексей', 'Викторович', '+7-863-123-45-00', NULL, TRUE, FALSE),
       ('Петренко', 'Людмила', 'Петровна', '+7-863-234-56-11', NULL, TRUE, FALSE);

-- Добавляем роли обычных сотрудников (employee_id = 119, 120)
INSERT INTO hr.employee_club (club_id, employee_id, employee_role)
VALUES (27, 119, 'EMPLOYEE'),
       (27, 120, 'EMPLOYEE');


--------------------------------------------------------------------------------------------
-- Открытие всех клубов
--------------------------------------------------------------------------------------------
UPDATE info.club
SET is_open = TRUE
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27);