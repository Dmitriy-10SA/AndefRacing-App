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

--------------------------------------------------------------------------------------------
-- Открытие всех клубов
--------------------------------------------------------------------------------------------
UPDATE info.club
SET is_open = TRUE
WHERE id IN (1, 2, 3, 4, 5, 6);