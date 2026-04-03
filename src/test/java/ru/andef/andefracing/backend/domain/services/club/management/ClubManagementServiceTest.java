package ru.andef.andefracing.backend.domain.services.club.management;

import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import ru.andef.andefracing.backend.data.entities.Client;
import ru.andef.andefracing.backend.data.entities.club.Club;
import ru.andef.andefracing.backend.data.entities.club.Game;
import ru.andef.andefracing.backend.data.entities.club.Photo;
import ru.andef.andefracing.backend.data.entities.club.Price;
import ru.andef.andefracing.backend.data.entities.club.booking.Booking;
import ru.andef.andefracing.backend.data.entities.club.hr.Employee;
import ru.andef.andefracing.backend.data.entities.club.work.schedule.WorkSchedule;
import ru.andef.andefracing.backend.data.entities.club.work.schedule.WorkScheduleException;
import ru.andef.andefracing.backend.data.entities.location.City;
import ru.andef.andefracing.backend.data.entities.location.Region;
import ru.andef.andefracing.backend.data.repositories.ClientRepository;
import ru.andef.andefracing.backend.data.repositories.club.*;
import ru.andef.andefracing.backend.data.repositories.location.CityRepository;
import ru.andef.andefracing.backend.data.repositories.location.RegionRepository;
import ru.andef.andefracing.backend.domain.exceptions.DuplicateException;
import ru.andef.andefracing.backend.domain.exceptions.EntityNotFoundException;
import ru.andef.andefracing.backend.domain.exceptions.management.CannotAddExceptionDayDueToExistingBookingsException;
import ru.andef.andefracing.backend.domain.exceptions.management.ClubCloseConditionsNotMetException;
import ru.andef.andefracing.backend.domain.exceptions.management.ClubOpenConditionsNotMetException;
import ru.andef.andefracing.backend.domain.exceptions.management.InvalidWorkScheduleException;
import ru.andef.andefracing.backend.network.dtos.common.GameDto;
import ru.andef.andefracing.backend.network.dtos.management.AddPriceDto;
import ru.andef.andefracing.backend.network.dtos.management.work.schedule.AddWorkScheduleExceptionDto;
import ru.andef.andefracing.backend.network.dtos.management.work.schedule.UpdateWorkScheduleDto;
import ru.andef.andefracing.backend.network.dtos.management.work.schedule.WorkScheduleExceptionDto;

import java.math.BigDecimal;
import java.time.*;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Sql(scripts = "classpath:scripts/db/truncate-all-tables-for-tests.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ClubManagementServiceTest {
    private final ClubManagementService clubManagementService;
    private final ClubRepository clubRepository;
    private final GameRepository gameRepository;
    private final PriceRepository priceRepository;
    private final WorkScheduleExceptionRepository workScheduleExceptionRepository;
    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final RegionRepository regionRepository;
    private final CityRepository cityRepository;

    @Autowired
    public ClubManagementServiceTest(
            ClubManagementService clubManagementService,
            ClubRepository clubRepository,
            GameRepository gameRepository,
            PriceRepository priceRepository,
            WorkScheduleExceptionRepository workScheduleExceptionRepository,
            BookingRepository bookingRepository,
            ClientRepository clientRepository,
            EmployeeRepository employeeRepository,
            RegionRepository regionRepository,
            CityRepository cityRepository
    ) {
        this.clubManagementService = clubManagementService;
        this.clubRepository = clubRepository;
        this.gameRepository = gameRepository;
        this.priceRepository = priceRepository;
        this.workScheduleExceptionRepository = workScheduleExceptionRepository;
        this.bookingRepository = bookingRepository;
        this.clientRepository = clientRepository;
        this.employeeRepository = employeeRepository;
        this.regionRepository = regionRepository;
        this.cityRepository = cityRepository;
    }

    private Region createRegion() {
        Region region = new Region((short) 0, "Region", new ArrayList<>());
        return regionRepository.save(region);
    }

    private City createCity(Region region) {
        City city = new City((short) 0, region, "City");
        return cityRepository.save(city);
    }

    private Club createClub(City city) {
        Club club = new Club(
                0,
                city,
                "Test Club",
                "+7-000-000-00-00",
                "test@example.com",
                "Test address",
                (short) 10,
                false,
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>()
        );
        return clubRepository.save(club);
    }

    private Game createGame(String name, boolean isActive) {
        Game game = new Game((short) 0, name, "http://example.com/" + name.replace(" ", "_") + ".jpg", isActive);
        return gameRepository.save(game);
    }

    private Client createClient() {
        Client client = new Client("Client", "+7-111-111-11-11", "password");
        return clientRepository.save(client);
    }

    private Employee createEmployee() {
        Employee employee = new Employee("Surname", "Name", "Patronymic", "+7-222-222-22-22");
        employee.setPassword("password");
        return employeeRepository.save(employee);
    }

    private LocalDateTime at(int hour) {
        return LocalDateTime.of(2026, 12, 31, hour, 0);
    }

    @Test
    void addGameToClubAddsGameSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        Game game = createGame("Test Game", true);
        createEmployee();

        // Act
        clubManagementService.addGameToClub(1, club.getId(), game.getId());

        // Assert
        List<Game> gamesInClub = gameRepository.findAllActiveGamesInClub(club.getId());
        assertEquals(1, gamesInClub.size());
        assertTrue(gamesInClub.contains(game));
    }

    @Test
    void addGameToClubThrowsExceptionWhenGameAlreadyInClub() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        Game game = createGame("Test Game", true);
        club.addGame(game);
        clubRepository.save(club);
        createEmployee();

        // Act & Assert
        assertThrows(DuplicateException.class, () ->
                clubManagementService.addGameToClub(1, club.getId(), game.getId())
        );
    }

    @Test
    void getAllActiveGamesReturnsOnlyActiveGames() {
        // Arrange
        createGame("Active Game 1", true);
        createGame("Active Game 2", true);
        createGame("Inactive Game", false);
        createEmployee();

        // Act
        List<GameDto> result = clubManagementService.getAllActiveGames(1);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    void deleteGameInClubRemovesGameSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        Game game = createGame("Test Game", true);
        club.addGame(game);
        clubRepository.save(club);
        createEmployee();

        // Act
        clubManagementService.deleteGameInClub(1, club.getId(), game.getId());

        // Assert
        List<Game> gamesInClub = gameRepository.findAllActiveGamesInClub(club.getId());
        assertTrue(gamesInClub.isEmpty());
    }

    @Test
    void deleteGameInClubThrowsExceptionWhenGameNotInClub() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        Game game = createGame("Test Game", true);
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.deleteGameInClub(1, club.getId(), game.getId())
        );
    }

    @Test
    void updateCntEquipmentInClubUpdatesCountSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        short newCount = 20;
        createEmployee();


        // Act
        clubManagementService.updateCntEquipmentInClub(1, club.getId(), newCount);

        // Assert
        Club updatedClub = clubRepository.findById(club.getId()).orElseThrow();
        assertEquals(newCount, updatedClub.getCntEquipment());
    }

    @Test
    void openClubOpensClubWhenAllConditionsMet() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);

        // Добавляем фото
        club.addPhoto(new Photo("http://example.com/photo1.jpg", (short) 1));

        // Добавляем цену
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));

        // Добавляем график работы (7 дней)
        for (DayOfWeek day : DayOfWeek.values()) {
            WorkSchedule workSchedule = new WorkSchedule(0L, (short) day.getValue(), LocalTime.of(10, 0), LocalTime.of(22, 0), true);
            club.getWorkSchedules().add(workSchedule);
            workSchedule.setClub(club);
        }

        // Добавляем игру
        Game game = createGame("Test Game", true);
        club.addGame(game);

        clubRepository.save(club);
        createEmployee();

        // Act
        clubManagementService.openClub(1, club.getId());

        // Assert
        Club updatedClub = clubRepository.findById(club.getId()).orElseThrow();
        assertTrue(updatedClub.isOpen());
    }

    @Test
    void openClubThrowsExceptionWhenConditionsNotMet() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        createEmployee();

        // Act & Assert
        assertThrows(ClubOpenConditionsNotMetException.class, () ->
                clubManagementService.openClub( 1, club.getId())
        );
    }

    @Test
    void closeClubClosesClubWhenNoUpcomingBookings() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        club.setOpen(true);
        clubRepository.save(club);
        createEmployee();

        // Act
        clubManagementService.closeClub(1, club.getId());

        // Assert
        Club updatedClub = clubRepository.findById(club.getId()).orElseThrow();
        assertFalse(updatedClub.isOpen());
    }

    @Test
    void closeClubThrowsExceptionWhenUpcomingBookingsExist() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        club.setOpen(true);
        clubRepository.save(club);

        Client client = createClient();
        Employee employee = createEmployee();

        // Создаем будущее бронирование
        Booking booking = new Booking(
                club,
                client,
                at(10),
                at(12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking"
        );
        booking.confirmPay(employee);
        bookingRepository.save(booking);

        // Act & Assert
        assertThrows(ClubCloseConditionsNotMetException.class, () ->
                clubManagementService.closeClub(1, club.getId())
        );
    }

    @Test
    void addPriceForMinutesInClubAddsPriceSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        AddPriceDto dto = new AddPriceDto((short) 60, new BigDecimal("1000.00"));
        createEmployee();

        // Act
        clubManagementService.addPriceForMinutesInClub(1, club.getId(), dto);

        // Assert
        Club updatedClub = clubRepository.findById(club.getId()).orElseThrow();
        assertEquals(1, updatedClub.getPrices().size());
        assertEquals((short) 60, updatedClub.getPrices().get(0).getDurationMinutes());
        assertEquals(new BigDecimal("1000.00"), updatedClub.getPrices().get(0).getValue());
    }

    @Test
    void addPriceForMinutesInClubThrowsExceptionWhenDurationAlreadyExists() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));
        clubRepository.save(club);
        createEmployee();
        AddPriceDto dto = new AddPriceDto((short) 60, new BigDecimal("1500.00"));

        // Act & Assert
        assertThrows(DuplicateException.class, () ->
                clubManagementService.addPriceForMinutesInClub(1, club.getId(), dto)
        );
    }

    @Test
    void updatePriceForMinutesInClubUpdatesPriceSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));
        club = clubRepository.save(club);
        long priceId = club.getPrices().get(0).getId();
        BigDecimal newValue = new BigDecimal("1500.00");
        createEmployee();

        // Act
        clubManagementService.updatePriceForMinutesInClub(1, club.getId(), priceId, newValue);

        // Assert
        Price updatedPrice = priceRepository.findById(priceId).orElseThrow();
        assertEquals(new BigDecimal("1500.00"), updatedPrice.getValue());
    }

    @Test
    void updatePriceForMinutesInClubThrowsExceptionWhenPriceNotFound() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        long nonExistentPriceId = 999L;
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.updatePriceForMinutesInClub(1, club.getId(), nonExistentPriceId, new BigDecimal("1000.00"))
        );
    }

    @Test
    void deletePriceForMinutesInClubRemovesPriceSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));
        club = clubRepository.save(club);
        long priceId = club.getPrices().get(0).getId();
        createEmployee();

        // Act
        clubManagementService.deletePriceForMinutesInClub(1, club.getId(), priceId);

        // Assert
        Club updatedClub = clubRepository.findById(club.getId()).orElseThrow();
        assertTrue(updatedClub.getPrices().isEmpty());
    }

    @Test
    void deletePriceForMinutesInClubThrowsExceptionWhenPriceNotInClub() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        long nonExistentPriceId = 999L;
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.deletePriceForMinutesInClub(1, club.getId(), nonExistentPriceId)
        );
    }

    @Test
    void addWorkScheduleExceptionInClubAddsExceptionSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        LocalDate date = LocalDate.of(2026, 12, 31);
        AddWorkScheduleExceptionDto dto = new AddWorkScheduleExceptionDto(
                date,
                LocalTime.of(12, 0),
                LocalTime.of(18, 0),
                true,
                "Special hours"
        );
        createEmployee();

        // Act
        clubManagementService.addWorkScheduleExceptionInClub(1, club.getId(), dto);

        // Assert
        List<WorkScheduleException> exceptions = workScheduleExceptionRepository.findAllByRangeOfDatesBetweenStartAndEnd(
                club.getId(), date, date
        );
        assertEquals(1, exceptions.size());
    }

    @Test
    void addWorkScheduleExceptionInClubThrowsExceptionWhenDateAlreadyExists() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        LocalDate date = LocalDate.of(2026, 12, 31);
        club.addWorkScheduleException(new WorkScheduleException(date, "Holiday"));
        clubRepository.save(club);

        AddWorkScheduleExceptionDto dto = new AddWorkScheduleExceptionDto(
                date,
                null,
                null,
                false,
                "Another holiday"
        );
        createEmployee();

        // Act & Assert
        assertThrows(DuplicateException.class, () ->
                clubManagementService.addWorkScheduleExceptionInClub(1, club.getId(), dto)
        );
    }

    @Test
    void addWorkScheduleExceptionInClubThrowsExceptionWhenInvalidWorkSchedule() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        LocalDate date = LocalDate.of(2026, 12, 31);

        // isWorkDay = true, но время не указано
        AddWorkScheduleExceptionDto dto = new AddWorkScheduleExceptionDto(
                date,
                null,
                null,
                true,
                "Invalid"
        );
        createEmployee();

        // Act & Assert
        assertThrows(InvalidWorkScheduleException.class, () ->
                clubManagementService.addWorkScheduleExceptionInClub(1, club.getId(), dto)
        );
    }

    @Test
    void addWorkScheduleExceptionInClubThrowsExceptionWhenBookingsExist() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        clubRepository.save(club);

        Client client = createClient();
        LocalDate date = LocalDate.of(2026, 12, 31);

        Booking booking = new Booking(
                club,
                client,
                at(10),
                at(12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking"
        );
        bookingRepository.save(booking);

        AddWorkScheduleExceptionDto dto = new AddWorkScheduleExceptionDto(
                date,
                null,
                null,
                false,
                "Holiday"
        );
        createEmployee();

        // Act & Assert
        assertThrows(CannotAddExceptionDayDueToExistingBookingsException.class, () ->
                clubManagementService.addWorkScheduleExceptionInClub(1, club.getId(), dto)
        );
    }

    @Test
    void getAllWorkSchedulesExceptionsInClubReturnsCorrectList() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        club.addWorkScheduleException(new WorkScheduleException(LocalDate.of(2026, 1, 1), "New Year"));
        club.addWorkScheduleException(new WorkScheduleException(LocalDate.of(2026, 1, 7), "Christmas"));
        club.addWorkScheduleException(new WorkScheduleException(LocalDate.of(2026, 2, 23), "Defender's Day"));
        clubRepository.save(club);
        createEmployee();

        // Act
        List<WorkScheduleExceptionDto> result = clubManagementService.getAllWorkSchedulesExceptionsInClub(
                1,
                club.getId(),
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 1, 31)
        );

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    void deleteWorkScheduleExceptionInClubRemovesExceptionSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        club.addWorkScheduleException(new WorkScheduleException(LocalDate.of(2027, 12, 31), "Holiday"));
        club = clubRepository.save(club);
        List<WorkScheduleException> savedExceptions = workScheduleExceptionRepository.findAllByRangeOfDatesBetweenStartAndEnd(
                club.getId(), LocalDate.of(2027, 12, 31), LocalDate.of(2027, 12, 31)
        );
        long exceptionId = savedExceptions.get(0).getId();
        createEmployee();

        // Act
        clubManagementService.deleteWorkScheduleExceptionInClub(1, club.getId(), exceptionId);

        // Assert
        List<WorkScheduleException> exceptions = workScheduleExceptionRepository.findAllByRangeOfDatesBetweenStartAndEnd(
                club.getId(), LocalDate.of(2027, 12, 31), LocalDate.of(2027, 12, 31)
        );
        assertTrue(exceptions.isEmpty());
    }

    @Test
    void deleteWorkScheduleExceptionInClubThrowsExceptionWhenNotFound() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        long nonExistentExceptionId = 999L;
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.deleteWorkScheduleExceptionInClub(1, club.getId(), nonExistentExceptionId)
        );
    }

    @Test
    void updateWorkScheduleInClubUpdatesToWorkingDaySuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        WorkSchedule workSchedule = new WorkSchedule(0L, (short) DayOfWeek.MONDAY.getValue(), LocalTime.of(10, 0), LocalTime.of(20, 0), true);
        club.getWorkSchedules().add(workSchedule);
        workSchedule.setClub(club);
        clubRepository.save(club);
        createEmployee();

        UpdateWorkScheduleDto dto = new UpdateWorkScheduleDto(
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(22, 0),
                true
        );

        // Act
        clubManagementService.updateWorkScheduleInClub(1, club.getId(), dto);

        // Assert
        Club updatedClub = clubRepository.findById(club.getId()).orElseThrow();
        WorkSchedule monday = updatedClub.getWorkSchedules().stream()
                .filter(ws -> ws.getDayOfWeek() == DayOfWeek.MONDAY.getValue())
                .findFirst()
                .orElseThrow();
        assertEquals(LocalTime.of(9, 0), monday.getOpenTime());
        assertEquals(LocalTime.of(22, 0), monday.getCloseTime());
    }

    @Test
    void updateWorkScheduleInClubUpdatesToNonWorkingDaySuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        WorkSchedule workSchedule = new WorkSchedule(0L, (short) DayOfWeek.SUNDAY.getValue(), LocalTime.of(10, 0), LocalTime.of(20, 0), true);
        club.getWorkSchedules().add(workSchedule);
        workSchedule.setClub(club);
        clubRepository.save(club);
        createEmployee();

        UpdateWorkScheduleDto dto = new UpdateWorkScheduleDto(
                DayOfWeek.SUNDAY,
                null,
                null,
                false
        );

        // Act
        clubManagementService.updateWorkScheduleInClub(1, club.getId(), dto);

        // Assert
        Club updatedClub = clubRepository.findById(club.getId()).orElseThrow();
        WorkSchedule sunday = updatedClub.getWorkSchedules().stream()
                .filter(ws -> ws.getDayOfWeek() == DayOfWeek.SUNDAY.getValue())
                .findFirst()
                .orElseThrow();
        assertNull(sunday.getOpenTime());
        assertNull(sunday.getCloseTime());
    }

    @Test
    void updateWorkScheduleInClubThrowsExceptionWhenInvalidSchedule() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        createEmployee();

        // isWorkDay = true, но время не указано
        UpdateWorkScheduleDto dto = new UpdateWorkScheduleDto(
                DayOfWeek.MONDAY,
                null,
                null,
                true
        );

        // Act & Assert
        assertThrows(InvalidWorkScheduleException.class, () ->
                clubManagementService.updateWorkScheduleInClub(1, club.getId(), dto)
        );
    }

    @Test
    void addGameToClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        Game game = createGame("Test Game", true);
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.addGameToClub(1, nonExistentClubId, game.getId())
        );
    }

    @Test
    void addGameToClubThrowsExceptionWhenGameNotFound() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        short nonExistentGameId = 999;
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.addGameToClub(1, club.getId(), nonExistentGameId)
        );
    }

    @Test
    void deleteGameInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        Game game = createGame("Test Game", true);
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.deleteGameInClub(1, nonExistentClubId, game.getId())
        );
    }

    @Test
    void updateCntEquipmentInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        short newCount = 20;
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.updateCntEquipmentInClub(1, nonExistentClubId, newCount)
        );
    }

    @Test
    void openClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        createEmployee();
        int nonExistentClubId = 999;

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.openClub(1, nonExistentClubId)
        );
    }

    @Test
    void closeClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.closeClub(1, nonExistentClubId)
        );
    }

    @Test
    void addPriceForMinutesInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        AddPriceDto dto = new AddPriceDto((short) 60, new BigDecimal("1000.00"));
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.addPriceForMinutesInClub(1, nonExistentClubId, dto)
        );
    }

    @Test
    void updatePriceForMinutesInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        long priceId = 1L;
        BigDecimal newValue = new BigDecimal("1500.00");
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.updatePriceForMinutesInClub(1, nonExistentClubId, priceId, newValue)
        );
    }

    @Test
    void deletePriceForMinutesInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        long priceId = 1L;
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.deletePriceForMinutesInClub(1, nonExistentClubId, priceId)
        );
    }

    @Test
    void addWorkScheduleExceptionInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        LocalDate date = LocalDate.of(2026, 12, 31);
        AddWorkScheduleExceptionDto dto = new AddWorkScheduleExceptionDto(
                date,
                null,
                null,
                false,
                "Holiday"
        );
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.addWorkScheduleExceptionInClub(1, nonExistentClubId, dto)
        );
    }

    @Test
    void getAllWorkSchedulesExceptionsInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 31);
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.getAllWorkSchedulesExceptionsInClub(1, nonExistentClubId, startDate, endDate)
        );
    }

    @Test
    void deleteWorkScheduleExceptionInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        long exceptionId = 1L;
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.deleteWorkScheduleExceptionInClub(1, nonExistentClubId, exceptionId)
        );
    }

    @Test
    void updateWorkScheduleInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        int nonExistentClubId = 999;
        UpdateWorkScheduleDto dto = new UpdateWorkScheduleDto(
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(22, 0),
                true
        );
        createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                clubManagementService.updateWorkScheduleInClub(1, nonExistentClubId, dto)
        );
    }

    @Test
    void updateWorkScheduleInClubThrowsExceptionWhenOpenTimeAfterCloseTime() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);

        UpdateWorkScheduleDto dto = new UpdateWorkScheduleDto(
                DayOfWeek.MONDAY,
                LocalTime.of(22, 0),
                LocalTime.of(9, 0),
                true
        );
        createEmployee();

        // Act & Assert
        assertThrows(InvalidWorkScheduleException.class, () ->
                clubManagementService.updateWorkScheduleInClub(1, club.getId(), dto)
        );
    }

    @Test
    void addWorkScheduleExceptionInClubThrowsExceptionWhenOpenTimeAfterCloseTime() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        LocalDate date = LocalDate.of(2026, 12, 31);
        createEmployee();

        AddWorkScheduleExceptionDto dto = new AddWorkScheduleExceptionDto(
                date,
                LocalTime.of(22, 0),
                LocalTime.of(9, 0),
                true,
                "Invalid hours"
        );

        // Act & Assert
        assertThrows(InvalidWorkScheduleException.class, () ->
                clubManagementService.addWorkScheduleExceptionInClub(1, club.getId(), dto)
        );
    }

    @Test
    void getAllActiveGamesReturnsEmptyListWhenNoActiveGames() {
        // Arrange
        createGame("Inactive Game 1", false);
        createGame("Inactive Game 2", false);
        createEmployee();

        // Act
        List<GameDto> result = clubManagementService.getAllActiveGames(1);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void openClubThrowsExceptionWhenNoPhotos() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);

        // Добавляем цену
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));

        // Добавляем график работы (7 дней)
        for (DayOfWeek day : DayOfWeek.values()) {
            WorkSchedule workSchedule = new WorkSchedule(0L, (short) day.getValue(), LocalTime.of(10, 0), LocalTime.of(22, 0), true);
            club.getWorkSchedules().add(workSchedule);
            workSchedule.setClub(club);
        }
        createEmployee();

        // Добавляем игру
        Game game = createGame("Test Game", true);
        club.addGame(game);

        clubRepository.save(club);

        // Act & Assert
        assertThrows(ClubOpenConditionsNotMetException.class, () ->
                clubManagementService.openClub(1, club.getId())
        );
    }

    @Test
    void openClubThrowsExceptionWhenNoPrices() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);

        // Добавляем фото
        club.addPhoto(new Photo("http://example.com/photo1.jpg", (short) 1));

        // Добавляем график работы (7 дней)
        for (DayOfWeek day : DayOfWeek.values()) {
            WorkSchedule workSchedule = new WorkSchedule(0L, (short) day.getValue(), LocalTime.of(10, 0), LocalTime.of(22, 0), true);
            club.getWorkSchedules().add(workSchedule);
            workSchedule.setClub(club);
        }

        // Добавляем игру
        Game game = createGame("Test Game", true);
        club.addGame(game);

        clubRepository.save(club);
        createEmployee();

        // Act & Assert
        assertThrows(ClubOpenConditionsNotMetException.class, () ->
                clubManagementService.openClub(1, club.getId())
        );
    }

    @Test
    void openClubThrowsExceptionWhenNoGames() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);

        // Добавляем фото
        club.addPhoto(new Photo("http://example.com/photo1.jpg", (short) 1));

        // Добавляем цену
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));

        // Добавляем график работы (7 дней)
        for (DayOfWeek day : DayOfWeek.values()) {
            WorkSchedule workSchedule = new WorkSchedule(0L, (short) day.getValue(), LocalTime.of(10, 0), LocalTime.of(22, 0), true);
            workSchedule.setClub(club);
            club.getWorkSchedules().add(workSchedule);
        }
        createEmployee();

        clubRepository.save(club);

        // Act & Assert
        assertThrows(ClubOpenConditionsNotMetException.class, () ->
                clubManagementService.openClub(1, club.getId())
        );
    }

    @Test
    void openClubThrowsExceptionWhenIncompleteWorkSchedule() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);

        // Добавляем фото
        club.addPhoto(new Photo("http://example.com/photo1.jpg", (short) 1));

        // Добавляем цену
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));

        // Добавляем график работы (только 5 дней вместо 7)
        int cnt = 0;
        for (DayOfWeek day : DayOfWeek.values()) {
            if (cnt++ == 4) {
                break;
            }
            WorkSchedule workSchedule = new WorkSchedule(0L, (short) day.getValue(), LocalTime.of(10, 0), LocalTime.of(22, 0), true);
            club.getWorkSchedules().add(workSchedule);
            workSchedule.setClub(club);
        }
        // Добавляем игру
        Game game = createGame("Test Game", true);
        club.addGame(game);

        clubRepository.save(club);
        createEmployee();

        // Act & Assert
        assertThrows(ClubOpenConditionsNotMetException.class, () ->
                clubManagementService.openClub(1, club.getId())
        );
    }

    @Test
    void getAllWorkSchedulesExceptionsInClubReturnsEmptyListWhenNoExceptions() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        createEmployee();

        // Act
        List<WorkScheduleExceptionDto> result = clubManagementService.getAllWorkSchedulesExceptionsInClub(
                1,
                club.getId(),
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 1, 31)
        );

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void addPriceForMinutesInClubRoundsValueCorrectly() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        AddPriceDto dto = new AddPriceDto((short) 60, new BigDecimal("1000.555"));
        createEmployee();

        // Act
        clubManagementService.addPriceForMinutesInClub(1, club.getId(), dto);

        // Assert
        Club updatedClub = clubRepository.findById(club.getId()).orElseThrow();
        assertEquals(new BigDecimal("1000.56"), updatedClub.getPrices().get(0).getValue());
    }

    @Test
    void updatePriceForMinutesInClubRoundsValueCorrectly() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city);
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));
        club = clubRepository.save(club);
        long priceId = club.getPrices().get(0).getId();
        BigDecimal newValue = new BigDecimal("1500.999");
        createEmployee();

        // Act
        clubManagementService.updatePriceForMinutesInClub(1, club.getId(), priceId, newValue);

        // Assert
        Price updatedPrice = priceRepository.findById(priceId).orElseThrow();
        assertEquals(new BigDecimal("1501.00"), updatedPrice.getValue());
    }
}
