package ru.andef.andefracing.backend.domain.services.booking;

import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import ru.andef.andefracing.backend.data.entities.Client;
import ru.andef.andefracing.backend.data.entities.club.Club;
import ru.andef.andefracing.backend.data.entities.club.Price;
import ru.andef.andefracing.backend.data.entities.club.booking.Booking;
import ru.andef.andefracing.backend.data.entities.club.hr.Employee;
import ru.andef.andefracing.backend.data.entities.club.work.schedule.WorkScheduleException;
import ru.andef.andefracing.backend.data.entities.location.City;
import ru.andef.andefracing.backend.data.entities.location.Region;
import ru.andef.andefracing.backend.data.repositories.ClientRepository;
import ru.andef.andefracing.backend.data.repositories.club.BookingRepository;
import ru.andef.andefracing.backend.data.repositories.club.ClubRepository;
import ru.andef.andefracing.backend.data.repositories.club.EmployeeRepository;
import ru.andef.andefracing.backend.data.repositories.location.CityRepository;
import ru.andef.andefracing.backend.data.repositories.location.RegionRepository;
import ru.andef.andefracing.backend.domain.exceptions.EntityNotFoundException;
import ru.andef.andefracing.backend.domain.exceptions.InvalidDateRangeException;
import ru.andef.andefracing.backend.network.dtos.booking.FreeBookingSlotDto;
import ru.andef.andefracing.backend.network.dtos.booking.FreeBookingSlotsRequestDto;
import ru.andef.andefracing.backend.network.dtos.booking.client.ClientBookingFullInfoDto;
import ru.andef.andefracing.backend.network.dtos.booking.client.ClientBookingShortDto;
import ru.andef.andefracing.backend.network.dtos.booking.client.PagedClientBookingShortListDto;
import ru.andef.andefracing.backend.network.dtos.booking.employee.EmployeeBookingFullInfoDto;
import ru.andef.andefracing.backend.network.dtos.booking.employee.EmployeeBookingShortDto;
import ru.andef.andefracing.backend.network.dtos.booking.employee.PagedEmployeeBookingShortListDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Sql(scripts = "classpath:scripts/db/truncate-all-tables-for-tests.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class BookingSearchServiceTest {
    private final BookingSearchService bookingSearchService;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final ClubRepository clubRepository;
    private final BookingRepository bookingRepository;
    private final RegionRepository regionRepository;
    private final CityRepository cityRepository;

    @Autowired
    public BookingSearchServiceTest(
            BookingSearchService bookingSearchService,
            ClientRepository clientRepository,
            EmployeeRepository employeeRepository,
            ClubRepository clubRepository,
            BookingRepository bookingRepository,
            RegionRepository regionRepository,
            CityRepository cityRepository
    ) {
        this.bookingSearchService = bookingSearchService;
        this.clientRepository = clientRepository;
        this.employeeRepository = employeeRepository;
        this.clubRepository = clubRepository;
        this.bookingRepository = bookingRepository;
        this.regionRepository = regionRepository;
        this.cityRepository = cityRepository;
    }

    private Region createRegion() {
        Region region = new Region((short) 0, "Test Region", new ArrayList<>());
        return regionRepository.save(region);
    }

    private City createCity(Region region) {
        City city = new City((short) 0, region, "Test City");
        return cityRepository.save(city);
    }

    private Club createClub(City city, String name, boolean isOpen) {
        Club club = new Club(
                0,
                city,
                name,
                "+7-000-000-00-00",
                "test@example.com",
                "Test address",
                (short) 10,
                isOpen,
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>()
        );
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));
        club.addPrice(new Price((short) 120, new BigDecimal("1800.00")));

        return clubRepository.save(club);
    }

    private Client createClient(String name, String phone) {
        Client client = new Client(name, phone, "password");
        return clientRepository.save(client);
    }

    private Employee createEmployee() {
        Employee employee = new Employee("Surname", "Name", "Patronymic", "+7-333-333-33-33");
        employee.setPassword("password");
        return employeeRepository.save(employee);
    }

    private LocalDateTime at(int day, int hour) {
        return LocalDateTime.of(2026, 6, day, hour, 0, 0, 0);
    }

    @Test
    void getFreeBookingSlotsInClubReturnsAvailableSlots() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);

        LocalDate date = LocalDate.of(2026, 6, 15); // Monday
        FreeBookingSlotsRequestDto request = new FreeBookingSlotsRequestDto((short) 60, (short) 1, date);

        // Act
        List<FreeBookingSlotDto> result = bookingSearchService.getFreeBookingSlotsInClub(club.getId(), request, LocalDate.of(2026, 6, 15), LocalTime.of(9, 0));

        // Assert
        assertNotNull(result);
        assertFalse(result.isEmpty());
        // Should have slots from 9:00 to 20:00 (every 15 minutes)
        assertTrue(result.size() > 40);
    }

    @Test
    void getFreeBookingSlotsInClubExcludesOccupiedSlots() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient("Test Client", "+7-111-111-11-11");

        LocalDate date = LocalDate.of(2026, 6, 15);
        LocalDateTime bookingStart = at(15, 10);
        LocalDateTime bookingEnd = at(15, 11);

        // Create existing booking
        Booking booking = new Booking(club, client, bookingStart, bookingEnd, (short) 10, new BigDecimal("10000.00"), "Note for booking");
        bookingRepository.save(booking);

        FreeBookingSlotsRequestDto request = new FreeBookingSlotsRequestDto((short) 60, (short) 1, date);

        // Act
        List<FreeBookingSlotDto> result = bookingSearchService.getFreeBookingSlotsInClub(club.getId(), request, LocalDate.of(2026, 6, 15), LocalTime.of(9, 0));

        // Assert
        assertNotNull(result);
        // Should still have slots, but not at 10:00
        boolean hasSlotAt10 = result.stream()
                .anyMatch(slot -> slot.startDateTime().equals(bookingStart));
        assertFalse(hasSlotAt10);
    }

    @Test
    void getFreeBookingSlotsInClubReturnsEmptyListWhenClubIsClosed() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Closed Club", false);

        LocalDate date = LocalDate.of(2026, 6, 15);
        FreeBookingSlotsRequestDto request = new FreeBookingSlotsRequestDto((short) 60, (short) 1, date);

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingSearchService.getFreeBookingSlotsInClub(club.getId(), request, LocalDate.of(2026, 6, 15), LocalTime.of(9, 0))
        );
    }

    @Test
    void getFreeBookingSlotsInClubReturnsEmptyListForNonWorkDay() {
        // Arrange
        LocalDate date = LocalDate.of(2026, 6, 15); // Monday
        Region region = createRegion();
        City city = createCity(region);
        Club club = new Club(
                0,
                city,
                "Test Club",
                "+7-000-000-00-00",
                "test@example.com",
                "Test address",
                (short) 10,
                true,
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>()
        );
        club.addWorkScheduleException(new WorkScheduleException(date, null));
        clubRepository.save(club);
        club.addPrice(new Price((short) 60, new BigDecimal("1000.00")));
        club = clubRepository.save(club);

        FreeBookingSlotsRequestDto request = new FreeBookingSlotsRequestDto((short) 60, (short) 1, date);

        // Act
        List<FreeBookingSlotDto> result = bookingSearchService.getFreeBookingSlotsInClub(club.getId(), request, LocalDate.of(2026, 6, 15), LocalTime.of(9, 0));

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getFreeBookingSlotsInClubRespectsWorkScheduleException() {
        // Arrange
        Region region = createRegion();
        regionRepository.save(region);
        City city = createCity(region);
        cityRepository.save(city);
        Club club = createClub(city, "Test Club", true);
        clubRepository.save(club);

        LocalDate date = LocalDate.of(2026, 6, 15);

        // Add exception for this date (closed)
        WorkScheduleException exception = new WorkScheduleException(date, "Closed for testing");
        club.addWorkScheduleException(exception);
        clubRepository.save(club);

        FreeBookingSlotsRequestDto request = new FreeBookingSlotsRequestDto((short) 60, (short) 1, date);

        // Act
        List<FreeBookingSlotDto> result = bookingSearchService.getFreeBookingSlotsInClub(club.getId(), request, LocalDate.of(2026, 6, 15), LocalTime.of(9, 0));

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getFreeBookingSlotsInClubRespectsModifiedHoursInException() {
        // Arrange
        Region region = createRegion();
        regionRepository.save(region);
        City city = createCity(region);
        cityRepository.save(city);
        Club club = createClub(city, "Test Club", true);
        clubRepository.save(club);

        LocalDate date = LocalDate.of(2026, 6, 15);

        // Add exception with modified hours (10:00 - 12:00)
        WorkScheduleException exception = new WorkScheduleException(
                date,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                "Modified hours for testing"
        );
        club.addWorkScheduleException(exception);
        clubRepository.save(club);

        FreeBookingSlotsRequestDto request = new FreeBookingSlotsRequestDto((short) 60, (short) 1, date);

        // Act
        List<FreeBookingSlotDto> result = bookingSearchService.getFreeBookingSlotsInClub(club.getId(), request, LocalDate.of(2026, 6, 15), LocalTime.of(9, 0));

        // Assert
        assertNotNull(result);
        assertFalse(result.isEmpty());
        // All slots should be between 10:00 and 11:00 (only one 60-minute slot fits)
        assertTrue(result.stream().allMatch(slot ->
                !slot.startDateTime().isBefore(at(15, 10)) &&
                        !slot.endDateTime().isAfter(at(15, 12))
        ));
    }

    @Test
    void getAllClientBookingsReturnsBookingsInDateRange() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient("Test Client", "+7-111-111-11-11");

        Booking booking1 = new Booking(
                club, client,
                at(15, 10),
                at(15, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        Booking booking2 = new Booking(
                club, client,
                at(16, 14),
                at(16, 15),
                (short) 2,
                new BigDecimal("2000.00"),
                "Note for booking 2"
        );
        Booking booking3 = new Booking(
                club, client,
                at(20, 10),
                at(20, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 3"
        );
        bookingRepository.saveAll(List.of(booking1, booking2, booking3));

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 17);

        // Act
        List<ClientBookingShortDto> result = bookingSearchService.getAllClientBookings(
                client.getId(), startDate, endDate
        );

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size()); // Only booking1 and booking2
    }

    @Test
    void getAllClientBookingsReturnsEmptyListWhenNoBookings() {
        // Arrange
        Client client = createClient("Test Client", "+7-111-111-11-11");

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 17);

        // Act
        List<ClientBookingShortDto> result = bookingSearchService.getAllClientBookings(
                client.getId(), startDate, endDate
        );

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getAllClientBookingsThrowsExceptionWhenClientNotFound() {
        // Arrange
        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 17);

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingSearchService.getAllClientBookings(999L, startDate, endDate)
        );
    }

    @Test
    void getBookingFullInfoForClientReturnsBookingDetails() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient("Test Client", "+7-111-111-11-11");

        Booking booking = new Booking(
                club, client,
                at(15, 10),
                at(15, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking"
        );
        booking = bookingRepository.save(booking);

        // Act
        ClientBookingFullInfoDto result = bookingSearchService.getBookingFullInfoForClient(
                client.getId(), club.getId(), booking.getId()
        );

        // Assert
        assertNotNull(result);
        assertEquals(booking.getId(), result.getId());
        assertEquals(booking.getStartDateTime(), result.getStartDateTime());
        assertEquals(booking.getEndDateTime(), result.getEndDateTime());
    }

    @Test
    void getBookingFullInfoForClientThrowsExceptionWhenBookingNotFound() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient("Test Client", "+7-111-111-11-11");

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingSearchService.getBookingFullInfoForClient(client.getId(), club.getId(), 999L)
        );
    }

    @Test
    void getBookingsForEmployeeReturnsAllBookingsInClub() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client1 = createClient("Client 1", "+7-111-111-11-11");
        Client client2 = createClient("Client 2", "+7-222-222-22-22");
        Employee employee = createEmployee();

        Booking booking1 = new Booking(
                club, client1,
                at(15, 10),
                at(15, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        Booking booking2 = new Booking(
                club, client2,
                at(16, 14),
                at(16, 15),
                (short) 2,
                new BigDecimal("2000.00"),
                "Note for booking 2"
        );
        bookingRepository.saveAll(List.of(booking1, booking2));

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 17);

        // Act
        List<EmployeeBookingShortDto> result = bookingSearchService.getBookingsForEmployee(
                employee.getId(), club.getId(), startDate, endDate, Optional.empty()
        );

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    void getBookingsForEmployeeFiltersBookingsByClientPhone() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client1 = createClient("Client 1", "+7-111-111-11-11");
        Client client2 = createClient("Client 2", "+7-222-222-22-22");
        Employee employee = createEmployee();

        Booking booking1 = new Booking(
                club, client1,
                at(15, 10),
                at(15, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        Booking booking2 = new Booking(
                club, client2,
                at(16, 14),
                at(16, 15),
                (short) 2,
                new BigDecimal("2000.00"),
                "Note for booking 2"
        );
        bookingRepository.saveAll(List.of(booking1, booking2));

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 17);

        // Act
        List<EmployeeBookingShortDto> result = bookingSearchService.getBookingsForEmployee(
                employee.getId(), club.getId(), startDate, endDate, Optional.of("+7-111-111-11-11")
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getBookingsForEmployeeReturnsEmptyListWhenNoBookings() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Employee employee = createEmployee();

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 17);

        // Act
        List<EmployeeBookingShortDto> result = bookingSearchService.getBookingsForEmployee(
                employee.getId(), club.getId(), startDate, endDate, Optional.empty()
        );

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getBookingFullInfoForEmployeeReturnsBookingDetails() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient("Test Client", "+7-111-111-11-11");
        Employee employee = createEmployee();

        Booking booking = new Booking(
                club, client,
                at(15, 10),
                at(15, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking"
        );
        booking = bookingRepository.save(booking);

        // Act
        EmployeeBookingFullInfoDto result = bookingSearchService.getBookingFullInfoForEmployee(
                employee.getId(), club.getId(), booking.getId()
        );

        // Assert
        assertNotNull(result);
        assertEquals(booking.getId(), result.getId());
        assertEquals(booking.getStartDateTime(), result.getStartDateTime());
        assertEquals(booking.getEndDateTime(), result.getEndDateTime());
    }

    @Test
    void getBookingFullInfoForEmployeeThrowsExceptionWhenBookingNotFound() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Employee employee = createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingSearchService.getBookingFullInfoForEmployee(employee.getId(), club.getId(), 999L)
        );
    }

    @Test
    void getFreeBookingSlotsInClubThrowsExceptionWhenClubNotFound() {
        // Arrange
        LocalDate date = LocalDate.of(2026, 6, 15);
        FreeBookingSlotsRequestDto request = new FreeBookingSlotsRequestDto((short) 60, (short) 1, date);

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingSearchService.getFreeBookingSlotsInClub(999, request, LocalDate.of(2026, 6, 15), LocalTime.of(9, 0))
        );
    }

    @Test
    void getAllClientBookingsPagedReturnsPagedBookingsSortedByStartDateTime() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient("Test Client", "+7-111-111-11-11");

        Booking booking1 = new Booking(
                club, client,
                at(17, 10),
                at(17, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        Booking booking2 = new Booking(
                club, client,
                at(15, 14),
                at(15, 15),
                (short) 2,
                new BigDecimal("2000.00"),
                "Note for booking 2"
        );
        Booking booking3 = new Booking(
                club, client,
                at(16, 10),
                at(16, 11),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking 3"
        );
        bookingRepository.saveAll(List.of(booking1, booking2, booking3));

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 18);

        // Act
        PagedClientBookingShortListDto result = bookingSearchService.getAllClientBookingsPaged(
                client.getId(), startDate, endDate, 0, 2
        );

        // Assert
        assertNotNull(result);
        assertNotNull(result.content());
        assertNotNull(result.pageInfo());
        assertEquals(2, result.content().size());
        assertEquals(3, result.pageInfo().totalElements());
        assertEquals(2, result.pageInfo().totalPages());
        assertEquals(0, result.pageInfo().pageNumber());
        assertEquals(2, result.pageInfo().pageSize());
        assertFalse(result.pageInfo().isLast());
        // Check sorting by startDateTime
        assertEquals(booking2.getStartDateTime(), result.content().get(0).getStartDateTime());
        assertEquals(booking3.getStartDateTime(), result.content().get(1).getStartDateTime());
    }

    @Test
    void getAllClientBookingsPagedReturnsLastPageCorrectly() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient("Test Client", "+7-111-111-11-11");

        Booking booking1 = new Booking(
                club, client,
                at(15, 10),
                at(15, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        Booking booking2 = new Booking(
                club, client,
                at(16, 14),
                at(16, 15),
                (short) 2,
                new BigDecimal("2000.00"),
                "Note for booking 2"
        );
        Booking booking3 = new Booking(
                club, client,
                at(17, 10),
                at(17, 11),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking 3"
        );
        bookingRepository.saveAll(List.of(booking1, booking2, booking3));

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 18);

        // Act
        PagedClientBookingShortListDto result = bookingSearchService.getAllClientBookingsPaged(
                client.getId(), startDate, endDate, 1, 2
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.content().size());
        assertEquals(3, result.pageInfo().totalElements());
        assertEquals(2, result.pageInfo().totalPages());
        assertEquals(1, result.pageInfo().pageNumber());
        assertTrue(result.pageInfo().isLast());
    }

    @Test
    void getAllClientBookingsPagedReturnsEmptyPageWhenNoBookings() {
        // Arrange
        Client client = createClient("Test Client", "+7-111-111-11-11");

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 17);

        // Act
        PagedClientBookingShortListDto result = bookingSearchService.getAllClientBookingsPaged(
                client.getId(), startDate, endDate, 0, 10
        );

        // Assert
        assertNotNull(result);
        assertTrue(result.content().isEmpty());
        assertEquals(0, result.pageInfo().totalElements());
        assertEquals(0, result.pageInfo().totalPages());
        assertTrue(result.pageInfo().isLast());
    }

    @Test
    void getAllClientBookingsPagedThrowsExceptionWhenStartDateAfterEndDate() {
        // Arrange
        Client client = createClient("Test Client", "+7-111-111-11-11");

        LocalDate startDate = LocalDate.of(2026, 6, 20);
        LocalDate endDate = LocalDate.of(2026, 6, 15);

        // Act & Assert
        assertThrows(InvalidDateRangeException.class, () ->
                bookingSearchService.getAllClientBookingsPaged(client.getId(), startDate, endDate, 0, 10)
        );
    }

    @Test
    void getBookingsForEmployeePagedReturnsPagedBookingsSortedByStartDateTime() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client1 = createClient("Client 1", "+7-111-111-11-11");
        Client client2 = createClient("Client 2", "+7-222-222-22-22");
        Employee employee = createEmployee();

        Booking booking1 = new Booking(
                club, client1,
                at(17, 10),
                at(17, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        Booking booking2 = new Booking(
                club, client2,
                at(15, 14),
                at(15, 15),
                (short) 2,
                new BigDecimal("2000.00"),
                "Note for booking 2"
        );
        Booking booking3 = new Booking(
                club, client1,
                at(16, 10),
                at(16, 11),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking 3"
        );
        bookingRepository.saveAll(List.of(booking1, booking2, booking3));

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 18);

        // Act
        PagedEmployeeBookingShortListDto result = bookingSearchService.getBookingsForEmployeePaged(
                employee.getId(), club.getId(), startDate, endDate, Optional.empty(), 0, 2
        );

        // Assert
        assertNotNull(result);
        assertNotNull(result.content());
        assertNotNull(result.pageInfo());
        assertEquals(2, result.content().size());
        assertEquals(3, result.pageInfo().totalElements());
        assertEquals(2, result.pageInfo().totalPages());
        assertEquals(0, result.pageInfo().pageNumber());
        assertEquals(2, result.pageInfo().pageSize());
        assertFalse(result.pageInfo().isLast());
        // Check sorting by startDateTime
        assertEquals(booking2.getStartDateTime(), result.content().get(0).getStartDateTime());
        assertEquals(booking3.getStartDateTime(), result.content().get(1).getStartDateTime());
    }

    @Test
    void getBookingsForEmployeePagedFiltersBookingsByClientPhone() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client1 = createClient("Client 1", "+7-111-111-11-11");
        Client client2 = createClient("Client 2", "+7-222-222-22-22");
        Employee employee = createEmployee();

        Booking booking1 = new Booking(
                club, client1,
                at(15, 10),
                at(15, 11),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        Booking booking2 = new Booking(
                club, client2,
                at(16, 14),
                at(16, 15),
                (short) 2,
                new BigDecimal("2000.00"),
                "Note for booking 2"
        );
        Booking booking3 = new Booking(
                club, client1,
                at(17, 10),
                at(17, 11),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking 3"
        );
        bookingRepository.saveAll(List.of(booking1, booking2, booking3));

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 18);

        // Act
        PagedEmployeeBookingShortListDto result = bookingSearchService.getBookingsForEmployeePaged(
                employee.getId(), club.getId(), startDate, endDate, Optional.of("+7-111-111-11-11"), 0, 10
        );

        // Assert
        assertNotNull(result);
        assertEquals(2, result.content().size());
        assertEquals(2, result.pageInfo().totalElements());
        assertEquals(1, result.pageInfo().totalPages());
        assertTrue(result.pageInfo().isLast());
    }

    @Test
    void getBookingsForEmployeePagedReturnsEmptyPageWhenNoBookings() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Employee employee = createEmployee();

        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 17);

        // Act
        PagedEmployeeBookingShortListDto result = bookingSearchService.getBookingsForEmployeePaged(
                employee.getId(), club.getId(), startDate, endDate, Optional.empty(), 0, 10
        );

        // Assert
        assertNotNull(result);
        assertTrue(result.content().isEmpty());
        assertEquals(0, result.pageInfo().totalElements());
        assertEquals(0, result.pageInfo().totalPages());
        assertTrue(result.pageInfo().isLast());
    }

    @Test
    void getBookingsForEmployeePagedThrowsExceptionWhenStartDateAfterEndDate() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Employee employee = createEmployee();

        LocalDate startDate = LocalDate.of(2026, 6, 20);
        LocalDate endDate = LocalDate.of(2026, 6, 15);

        // Act & Assert
        assertThrows(InvalidDateRangeException.class, () ->
                bookingSearchService.getBookingsForEmployeePaged(
                        employee.getId(), club.getId(), startDate, endDate, Optional.empty(), 0, 10
                )
        );
    }
}
