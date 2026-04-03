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
import ru.andef.andefracing.backend.data.entities.club.booking.BookingStatus;
import ru.andef.andefracing.backend.data.entities.club.hr.Employee;
import ru.andef.andefracing.backend.data.entities.location.City;
import ru.andef.andefracing.backend.data.entities.location.Region;
import ru.andef.andefracing.backend.data.repositories.ClientRepository;
import ru.andef.andefracing.backend.data.repositories.club.BookingRepository;
import ru.andef.andefracing.backend.data.repositories.club.ClubRepository;
import ru.andef.andefracing.backend.data.repositories.club.EmployeeRepository;
import ru.andef.andefracing.backend.data.repositories.location.CityRepository;
import ru.andef.andefracing.backend.data.repositories.location.RegionRepository;
import ru.andef.andefracing.backend.domain.exceptions.EntityNotFoundException;
import ru.andef.andefracing.backend.domain.exceptions.auth.UserNotFoundFromTokenException;
import ru.andef.andefracing.backend.domain.exceptions.booking.InvalidBookingSlotException;
import ru.andef.andefracing.backend.domain.exceptions.booking.NotEnoughSimulatorsException;
import ru.andef.andefracing.backend.network.dtos.booking.FreeBookingSlotDto;
import ru.andef.andefracing.backend.network.dtos.booking.client.ClientMakeBookingDto;
import ru.andef.andefracing.backend.network.dtos.booking.employee.EmployeeMakeBookingDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Sql(scripts = "classpath:scripts/db/truncate-all-tables-for-tests.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class BookingManagementServiceTest {
    private final BookingManagementService bookingManagementService;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final ClubRepository clubRepository;
    private final BookingRepository bookingRepository;
    private final RegionRepository regionRepository;
    private final CityRepository cityRepository;

    @Autowired
    public BookingManagementServiceTest(
            BookingManagementService bookingManagementService,
            ClientRepository clientRepository,
            EmployeeRepository employeeRepository,
            ClubRepository clubRepository,
            BookingRepository bookingRepository,
            RegionRepository regionRepository,
            CityRepository cityRepository
    ) {
        this.bookingManagementService = bookingManagementService;
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

    private Client createClient() {
        Client client = new Client("Test Client", "+7-111-111-11-11", "password");
        return clientRepository.save(client);
    }

    private Employee createEmployee() {
        Employee employee = new Employee("Surname", "Name", "Patronymic", "+7-222-222-22-22");
        employee.setPassword("password");
        return employeeRepository.save(employee);
    }

    private LocalDateTime futureDateTime() {
        return LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
    }

    @Test
    void makeClientBookingCreatesBookingSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient();

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(60);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        ClientMakeBookingDto makeBookingDto = new ClientMakeBookingDto((short) 2, slot, null);

        // Act
        bookingManagementService.makeClientBooking(client.getId(), club.getId(), makeBookingDto);

        // Assert
        Booking booking = bookingRepository.findAll().get(0);
        assertNotNull(booking);
        assertEquals(client.getId(), booking.getClient().getId());
        assertEquals(club.getId(), booking.getClub().getId());
        assertEquals(start, booking.getStartDateTime());
        assertEquals(end, booking.getEndDateTime());
        assertEquals((short) 2, booking.getCntEquipment());
        assertEquals(new BigDecimal("2000.00"), booking.getPriceValue());
        assertEquals(BookingStatus.PENDING_PAYMENT, booking.getStatus());
    }

    @Test
    void makeClientBookingThrowsExceptionWhenStartAfterEnd() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient();

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.minusMinutes(60);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        ClientMakeBookingDto makeBookingDto = new ClientMakeBookingDto((short) 1, slot, null);

        // Act & Assert
        assertThrows(InvalidBookingSlotException.class, () ->
                bookingManagementService.makeClientBooking(client.getId(), club.getId(), makeBookingDto)
        );
    }

    @Test
    void makeClientBookingThrowsExceptionWhenClubIsClosed() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Closed Club", false);
        Client client = createClient();

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(60);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        ClientMakeBookingDto makeBookingDto = new ClientMakeBookingDto((short) 1, slot, null);

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingManagementService.makeClientBooking(client.getId(), club.getId(), makeBookingDto)
        );
    }

    @Test
    void makeClientBookingThrowsExceptionWhenDurationNotInPriceList() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient();

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(90); // 90 minutes not in price list
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        ClientMakeBookingDto makeBookingDto = new ClientMakeBookingDto((short) 1, slot, null);

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingManagementService.makeClientBooking(client.getId(), club.getId(), makeBookingDto)
        );
    }

    @Test
    void makeClientBookingThrowsExceptionWhenBookingInPast() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient();

        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = start.plusMinutes(60);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        ClientMakeBookingDto makeBookingDto = new ClientMakeBookingDto((short) 1, slot, null);

        // Act & Assert
        assertThrows(InvalidBookingSlotException.class, () ->
                bookingManagementService.makeClientBooking(client.getId(), club.getId(), makeBookingDto)
        );
    }

    @Test
    void makeClientBookingThrowsExceptionWhenNotEnoughSimulators() {
        // Arrange
        Region region = createRegion();
        regionRepository.save(region);
        City city = createCity(region);
        cityRepository.save(city);
        Club club = createClub(city, "Test Club", true);
        club.setCntEquipment((short) 10);
        clubRepository.save(club);
        Client client = createClient();
        clientRepository.save(client);

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(60);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        ClientMakeBookingDto makeBookingDto = new ClientMakeBookingDto((short) 15, slot, null); // More than available

        // Act & Assert
        assertThrows(NotEnoughSimulatorsException.class, () ->
                bookingManagementService.makeClientBooking(client.getId(), club.getId(), makeBookingDto)
        );
    }

    @Test
    void makeEmployeeBookingCreatesBookingSuccessfully() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Employee employee = createEmployee();

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(120);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        EmployeeMakeBookingDto makeBookingDto = new EmployeeMakeBookingDto((short) 1, slot, null);

        // Act
        bookingManagementService.makeEmployeeBooking(employee.getId(), club.getId(), makeBookingDto);

        // Assert
        Booking booking = bookingRepository.findAll().get(0);
        assertNotNull(booking);
        assertEquals(employee.getId(), booking.getCreatedByEmployee().getId());
        assertEquals(club.getId(), booking.getClub().getId());
        assertEquals(start, booking.getStartDateTime());
        assertEquals(end, booking.getEndDateTime());
        assertEquals((short) 1, booking.getCntEquipment());
        assertEquals(new BigDecimal("1800.00"), booking.getPriceValue());
    }

    @Test
    void makeEmployeeBookingThrowsExceptionWhenStartAfterEnd() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Employee employee = createEmployee();

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.minusMinutes(60);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        EmployeeMakeBookingDto makeBookingDto = new EmployeeMakeBookingDto((short) 1, slot, null);

        // Act & Assert
        assertThrows(InvalidBookingSlotException.class, () ->
                bookingManagementService.makeEmployeeBooking(employee.getId(), club.getId(), makeBookingDto)
        );
    }

    @Test
    void confirmBookingPaymentByEmployeeUpdatesBookingStatus() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient();
        Employee employee = createEmployee();

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(60);
        Booking booking = new Booking(club, client, start, end, (short) 1, new BigDecimal("1000.00"), "Note for booking");
        booking = bookingRepository.save(booking);

        // Act
        bookingManagementService.confirmBookingPaymentByEmployee(employee.getId(), club.getId(), booking.getId());

        // Assert
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.PAID, updatedBooking.getStatus());
        assertEquals(employee.getId(), updatedBooking.getPayConfirmedByEmployee().getId());
        assertEquals("Note for booking", updatedBooking.getNote());
    }

    @Test
    void confirmBookingPaymentByEmployeeThrowsExceptionWhenBookingNotFound() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Employee employee = createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingManagementService.confirmBookingPaymentByEmployee(employee.getId(), club.getId(), 999L)
        );
    }

    @Test
    void cancelBookingByEmployeeCancelsBooking() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Client client = createClient();
        Employee employee = createEmployee();

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(60);
        Booking booking = new Booking(club, client, start, end, (short) 1, new BigDecimal("1000.00"), "Note for booking");
        booking = bookingRepository.save(booking);

        // Act
        bookingManagementService.cancelBookingByEmployee(employee.getId(), club.getId(), booking.getId());

        // Assert
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.CANCELLED, updatedBooking.getStatus());
        assertEquals("Note for booking", updatedBooking.getNote());
    }

    @Test
    void cancelBookingByEmployeeThrowsExceptionWhenBookingNotFound() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);
        Employee employee = createEmployee();

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingManagementService.cancelBookingByEmployee(employee.getId(), club.getId(), 999L)
        );
    }

    @Test
    void makeClientBookingThrowsExceptionWhenClientNotFound() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(60);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        ClientMakeBookingDto makeBookingDto = new ClientMakeBookingDto((short) 1, slot, null);

        // Act & Assert
        assertThrows(UserNotFoundFromTokenException.class, () ->
                bookingManagementService.makeClientBooking(999L, club.getId(), makeBookingDto)
        );
    }

    @Test
    void makeClientBookingThrowsExceptionWhenClubNotFound() {
        // Arrange
        Client client = createClient();

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(60);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        ClientMakeBookingDto makeBookingDto = new ClientMakeBookingDto((short) 1, slot, null);

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () ->
                bookingManagementService.makeClientBooking(client.getId(), 999, makeBookingDto)
        );
    }

    @Test
    void makeEmployeeBookingThrowsExceptionWhenEmployeeNotFound() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club", true);

        LocalDateTime start = futureDateTime();
        LocalDateTime end = start.plusMinutes(60);
        FreeBookingSlotDto slot = new FreeBookingSlotDto(start, end);
        EmployeeMakeBookingDto makeBookingDto = new EmployeeMakeBookingDto((short) 1, slot, null);

        // Act & Assert
        assertThrows(UserNotFoundFromTokenException.class, () ->
                bookingManagementService.makeEmployeeBooking(999L, club.getId(), makeBookingDto)
        );
    }
}
