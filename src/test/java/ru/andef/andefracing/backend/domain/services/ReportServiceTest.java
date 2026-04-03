package ru.andef.andefracing.backend.domain.services;

import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import ru.andef.andefracing.backend.data.entities.Client;
import ru.andef.andefracing.backend.data.entities.club.Club;
import ru.andef.andefracing.backend.data.entities.club.booking.Booking;
import ru.andef.andefracing.backend.data.entities.club.hr.Employee;
import ru.andef.andefracing.backend.data.entities.location.City;
import ru.andef.andefracing.backend.data.entities.location.Region;
import ru.andef.andefracing.backend.data.repositories.ClientRepository;
import ru.andef.andefracing.backend.data.repositories.club.BookingRepository;
import ru.andef.andefracing.backend.data.repositories.club.ClubRepository;
import ru.andef.andefracing.backend.data.repositories.club.EmployeeRepository;
import ru.andef.andefracing.backend.data.repositories.location.CityRepository;
import ru.andef.andefracing.backend.data.repositories.location.RegionRepository;
import ru.andef.andefracing.backend.network.dtos.report.BookingStatisticsDto;
import ru.andef.andefracing.backend.network.dtos.report.FinancialStatisticsDto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Sql(scripts = "classpath:scripts/db/truncate-all-tables-for-tests.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ReportServiceTest {
    private final ReportService reportService;
    private final BookingRepository bookingRepository;
    private final ClubRepository clubRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final RegionRepository regionRepository;
    private final CityRepository cityRepository;

    @Autowired
    public ReportServiceTest(
            ReportService reportService,
            BookingRepository bookingRepository,
            ClubRepository clubRepository,
            ClientRepository clientRepository,
            EmployeeRepository employeeRepository,
            RegionRepository regionRepository,
            CityRepository cityRepository
    ) {
        this.reportService = reportService;
        this.bookingRepository = bookingRepository;
        this.clubRepository = clubRepository;
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

    private Club createClub(City city, String name) {
        Club club = new Club(
                0,
                city,
                name,
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
        return clubRepository.save(club);
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

    private LocalDateTime at(int year, int month, int day, int hour) {
        return LocalDateTime.of(year, month, day, hour, 0);
    }

    @Test
    void getBookingStatisticsReturnsCorrectStatisticsForClubInDateRange() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club");
        Client client = createClient();

        // Создаем бронирования в диапазоне дат
        Booking booking1 = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );

        Booking booking2 = new Booking(
                club,
                client,
                at(2026, 1, 1, 14),
                at(2026, 1, 1, 16),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking 2"
        );

        Booking booking3 = new Booking(
                club,
                client,
                at(2026, 1, 2, 10),
                at(2026, 1, 2, 12),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for booking 3"
        );
        booking3.cancel(); // Отменяем одно бронирование

        Booking booking4 = new Booking(
                club,
                client,
                at(2026, 1, 3, 10),
                at(2026, 1, 3, 12),
                (short) 1,
                new BigDecimal("2500.00"),
                "Note for booking 4"
        );

        // Бронирование вне диапазона
        Booking bookingOutOfRange = new Booking(
                club,
                client,
                at(2025, 12, 31, 10),
                at(2025, 12, 31, 12),
                (short) 1,
                new BigDecimal("3000.00"),
                "Note for booking out of range"
        );

        bookingRepository.saveAll(List.of(booking1, booking2, booking3, booking4, bookingOutOfRange));

        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 3);

        createEmployee();

        // Act
        BookingStatisticsDto result = reportService.getBookingStatistics(1, club.getId(), startDate, endDate);

        // Assert
        assertNotNull(result);
        assertEquals(club.getId(), result.clubId());
        assertEquals(startDate, result.startDate());
        assertEquals(endDate, result.endDate());
        assertEquals(4L, result.bookingsCount()); // 4 бронирования в диапазоне
        assertEquals(new BigDecimal("25.00"), result.cancellationsPercent().setScale(2, RoundingMode.HALF_EVEN)); // 1 из 4 = 25%

        // Проверяем бронирования по дням
        List<BookingStatisticsDto.DateAndBookingsCountDto> dateAndBookings = result.dateAndBookingsCountDtoList();
        assertEquals(3, dateAndBookings.size());

        assertEquals(LocalDate.of(2026, 1, 1), dateAndBookings.get(0).date());
        assertEquals(2L, dateAndBookings.get(0).bookingsCount());

        assertEquals(LocalDate.of(2026, 1, 2), dateAndBookings.get(1).date());
        assertEquals(1L, dateAndBookings.get(1).bookingsCount());

        assertEquals(LocalDate.of(2026, 1, 3), dateAndBookings.get(2).date());
        assertEquals(1L, dateAndBookings.get(2).bookingsCount());
    }

    @Test
    void getBookingStatisticsReturnsEmptyListWhenNoBookingsInRange() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Empty Club");

        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 31);

        createEmployee();

        // Act
        BookingStatisticsDto result = reportService.getBookingStatistics(1, club.getId(), startDate, endDate);

        // Assert
        assertNotNull(result);
        assertEquals(club.getId(), result.clubId());
        assertEquals(0L, result.bookingsCount());
        assertTrue(result.dateAndBookingsCountDtoList().isEmpty());
    }

    @Test
    void getFinancialStatisticsReturnsCorrectStatisticsForClubInDateRange() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club");
        Client client = createClient();
        Employee employee = createEmployee();

        // Создаем оплаченные бронирования
        Booking paid1 = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        paid1.confirmPay(employee);

        Booking paid2 = new Booking(
                club,
                client,
                at(2026, 1, 1, 14),
                at(2026, 1, 1, 16),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking 2"
        );
        paid2.confirmPay(employee);

        Booking paid3 = new Booking(
                club,
                client,
                at(2026, 1, 2, 10),
                at(2026, 1, 2, 12),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for booking 3"
        );
        paid3.confirmPay(employee);

        Booking paid4 = new Booking(
                club,
                client,
                at(2026, 1, 3, 10),
                at(2026, 1, 3, 12),
                (short) 1,
                new BigDecimal("2500.00"),
                "Note for booking 4"
        );
        paid4.confirmPay(employee);

        // Неоплаченное бронирование (не должно учитываться)
        Booking pending = new Booking(
                club,
                client,
                at(2026, 1, 2, 14),
                at(2026, 1, 2, 16),
                (short) 1,
                new BigDecimal("5000.00"),
                "Note for booking pending"
        );

        bookingRepository.saveAll(List.of(paid1, paid2, paid3, paid4, pending));

        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 3);

        // Act
        FinancialStatisticsDto result = reportService.getFinancialStatistics(1, club.getId(), startDate, endDate);

        // Assert
        assertNotNull(result);
        assertEquals(club.getId(), result.clubId());
        assertEquals(startDate, result.startDate());
        assertEquals(endDate, result.endDate());
        assertEquals(new BigDecimal("7000.00"), result.totalRevenue()); // 1000 + 1500 + 2000 + 2500
        assertEquals(new BigDecimal("1750.00"), result.averageReceipt()); // 7000 / 4

        // Проверяем выручку по дням
        List<FinancialStatisticsDto.DateAndTotalRevenueDto> dateAndRevenues = result.dateAndTotalRevenues();
        assertEquals(3, dateAndRevenues.size());

        assertEquals(LocalDate.of(2026, 1, 1), dateAndRevenues.get(0).date());
        assertEquals(new BigDecimal("2500.00"), dateAndRevenues.get(0).revenue());

        assertEquals(LocalDate.of(2026, 1, 2), dateAndRevenues.get(1).date());
        assertEquals(new BigDecimal("2000.00"), dateAndRevenues.get(1).revenue());

        assertEquals(LocalDate.of(2026, 1, 3), dateAndRevenues.get(2).date());
        assertEquals(new BigDecimal("2500.00"), dateAndRevenues.get(2).revenue());
    }

    @Test
    void getFinancialStatisticsReturnsZeroWhenNoPaidBookingsInRange() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Empty Club");

        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 31);

        createEmployee();

        // Act
        FinancialStatisticsDto result = reportService.getFinancialStatistics(1, club.getId(), startDate, endDate);

        // Assert
        assertNotNull(result);
        assertEquals(club.getId(), result.clubId());
        assertTrue(result.dateAndTotalRevenues().isEmpty());
    }

    @Test
    void getFinancialStatisticsIgnoresCancelledBookings() {
        // Arrange
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Test Club");
        Client client = createClient();
        Employee employee = createEmployee();

        Booking paid = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking paid"
        );
        paid.confirmPay(employee);

        Booking cancelled = new Booking(
                club,
                client,
                at(2026, 1, 1, 14),
                at(2026, 1, 1, 16),
                (short) 1,
                new BigDecimal("5000.00"),
                "Note for booking cancelled"
        );
        cancelled.cancel();

        bookingRepository.saveAll(List.of(paid, cancelled));

        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 1);

        // Act
        FinancialStatisticsDto result = reportService.getFinancialStatistics(1, club.getId(), startDate, endDate);

        // Assert
        assertEquals(new BigDecimal("1000.00"), result.totalRevenue());
        assertEquals(new BigDecimal("1000.00"), result.averageReceipt());
    }
}