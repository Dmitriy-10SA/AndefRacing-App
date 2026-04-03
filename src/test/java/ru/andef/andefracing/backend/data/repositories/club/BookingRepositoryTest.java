package ru.andef.andefracing.backend.data.repositories.club;

import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import ru.andef.andefracing.backend.data.entities.Client;
import ru.andef.andefracing.backend.data.entities.club.Club;
import ru.andef.andefracing.backend.data.entities.club.booking.Booking;
import ru.andef.andefracing.backend.data.entities.club.hr.Employee;
import ru.andef.andefracing.backend.data.entities.location.City;
import ru.andef.andefracing.backend.data.entities.location.Region;
import ru.andef.andefracing.backend.data.projections.BookingStatsAggregateProjection;
import ru.andef.andefracing.backend.data.projections.BookingsPerDayProjection;
import ru.andef.andefracing.backend.data.projections.FinancialStatsAggregateProjection;
import ru.andef.andefracing.backend.data.projections.RevenuePerDayProjection;
import ru.andef.andefracing.backend.data.repositories.ClientRepository;
import ru.andef.andefracing.backend.data.repositories.location.CityRepository;
import ru.andef.andefracing.backend.data.repositories.location.RegionRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@Transactional
@Sql(scripts = "classpath:scripts/db/truncate-all-tables-for-tests.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class BookingRepositoryTest {
    private final BookingRepository bookingRepository;
    private final ClubRepository clubRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final RegionRepository regionRepository;
    private final CityRepository cityRepository;

    @Autowired
    public BookingRepositoryTest(
            BookingRepository bookingRepository,
            ClubRepository clubRepository,
            ClientRepository clientRepository,
            EmployeeRepository employeeRepository,
            RegionRepository regionRepository,
            CityRepository cityRepository
    ) {
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

    private Client createClient(String name, String phone) {
        Client client = new Client(name, phone, "password");
        return clientRepository.save(client);
    }

    private Employee createEmployee() {
        Employee employee = new Employee("Surname", "Name", "Patronymic", "+7-222-222-22-22");
        return employeeRepository.save(employee);
    }

    private LocalDateTime at(int year, int month, int day, int hour) {
        return LocalDateTime.of(year, month, day, hour, 0);
    }

    @Test
    void getBookingStatsAggregateCountsBookingsAndCancellationsInRangeForClub() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club1");
        Club otherClub = createClub(city, "Club2");

        Client client = createClient("Client", "+7-111-111-11-11");

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
                at(2026, 1, 2, 10),
                at(2026, 1, 2, 12),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for booking 2"
        );
        booking2.cancel();

        Booking bookingOutOfRange = new Booking(
                club,
                client,
                at(2025, 12, 31, 10),
                at(2025, 12, 31, 12),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking out of range"
        );

        Booking bookingOtherClub = new Booking(
                otherClub,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking other club"
        );

        bookingRepository.saveAll(List.of(booking1, booking2, bookingOutOfRange, bookingOtherClub));

        LocalDateTime start = at(2026, 1, 1, 0);
        LocalDateTime end = at(2026, 1, 3, 0);

        BookingStatsAggregateProjection stats =
                bookingRepository.getBookingStatsAggregate(club.getId(), start, end);

        assertEquals(2L, stats.getBookingsCount());
        assertEquals(new BigDecimal("50.00"), stats.getCancellationsPercent().setScale(2, RoundingMode.HALF_EVEN));
    }

    @Test
    void getBookingsPerDayReturnsCountsPerDayInRangeForClub() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client = createClient("Client", "+7-111-111-11-11");

        Booking bookingDay1 = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking day 1"
        );
        Booking bookingDay1Second = new Booking(
                club,
                client,
                at(2026, 1, 1, 14),
                at(2026, 1, 1, 16),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking day 1 second"
        );
        Booking bookingDay2 = new Booking(
                club,
                client,
                at(2026, 1, 2, 10),
                at(2026, 1, 2, 12),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for booking day 2"
        );

        bookingRepository.saveAll(List.of(bookingDay1, bookingDay1Second, bookingDay2));

        LocalDateTime start = at(2026, 1, 1, 0);
        LocalDateTime end = at(2026, 1, 3, 0);

        List<BookingsPerDayProjection> perDay =
                bookingRepository.getBookingsPerDay(club.getId(), start, end);

        assertEquals(2, perDay.size());
        assertEquals(LocalDate.of(2026, 1, 1), perDay.get(0).getDate());
        assertEquals(2L, perDay.get(0).getBookingsCount());
        assertEquals(LocalDate.of(2026, 1, 2), perDay.get(1).getDate());
        assertEquals(1L, perDay.get(1).getBookingsCount());
    }

    @Test
    void getFinancialStatAggregateSumsAndAveragesPaidBookingsInRangeForClub() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client = createClient("Client", "+7-111-111-11-11");
        Employee employee = createEmployee();

        Booking paid1 = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking day 1"
        );
        paid1.confirmPay(employee);

        Booking paid2 = new Booking(
                club,
                client,
                at(2026, 1, 2, 10),
                at(2026, 1, 2, 12),
                (short) 1,
                new BigDecimal("3000.00"),
                "Note for booking day 2"
        );
        paid2.confirmPay(employee);

        Booking pending = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("5000.00"),
                "Note for booking pending"
        );

        bookingRepository.saveAll(List.of(paid1, paid2, pending));

        LocalDateTime start = at(2026, 1, 1, 0);
        LocalDateTime end = at(2026, 1, 3, 0);

        FinancialStatsAggregateProjection stats =
                bookingRepository.getFinancialStatAggregate(club.getId(), start, end);

        assertEquals(new BigDecimal("4000.00"), stats.getTotalRevenue().setScale(2, RoundingMode.HALF_EVEN));
        assertEquals(new BigDecimal("2000.00"), stats.getAverageReceipt().setScale(2, RoundingMode.HALF_EVEN));
    }

    @Test
    void getRevenuePerDayReturnsDailyRevenueForPaidBookingsInRangeForClub() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client = createClient("Client", "+7-111-111-11-11");
        Employee employee = createEmployee();

        Booking paidDay1 = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking day 1"
        );
        paidDay1.confirmPay(employee);

        Booking paidDay1Second = new Booking(
                club,
                client,
                at(2026, 1, 1, 14),
                at(2026, 1, 1, 16),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking day 1 second"
        );
        paidDay1Second.confirmPay(employee);

        Booking paidDay2 = new Booking(
                club,
                client,
                at(2026, 1, 2, 10),
                at(2026, 1, 2, 12),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for booking day 2"
        );
        paidDay2.confirmPay(employee);

        bookingRepository.saveAll(List.of(paidDay1, paidDay1Second, paidDay2));

        LocalDateTime start = at(2026, 1, 1, 0);
        LocalDateTime end = at(2026, 1, 3, 0);

        List<RevenuePerDayProjection> perDay =
                bookingRepository.getRevenuePerDay(club.getId(), start, end);

        assertEquals(2, perDay.size());
        assertEquals(LocalDate.of(2026, 1, 1), perDay.get(0).getDate());
        assertEquals(new BigDecimal("2500.00"), perDay.get(0).getRevenue());
        assertEquals(LocalDate.of(2026, 1, 2), perDay.get(1).getDate());
        assertEquals(new BigDecimal("2000.00"), perDay.get(1).getRevenue());
    }

    @Test
    void countUpcomingPaidOrPendingBookingsCountsOnlyFuturePaidAndPendingForClub() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client = createClient("Client", "+7-111-111-11-11");
        Employee employee = createEmployee();

        LocalDateTime now = LocalDateTime.now();

        Booking futurePaid = new Booking(
                club,
                client,
                now.plusHours(1),
                now.plusHours(2),
                (short) 1,
                new BigDecimal("1000.00"),
                null
        );
        futurePaid.confirmPay(employee);

        Booking futurePending = new Booking(
                club,
                client,
                now.plusHours(3),
                now.plusHours(4),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for future pending booking"
        );

        Booking pastPaid = new Booking(
                club,
                client,
                now.minusHours(4),
                now.minusHours(3),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for past paid booking"
        );
        pastPaid.confirmPay(employee);

        Booking futureCancelled = new Booking(
                club,
                client,
                now.plusHours(5),
                now.plusHours(6),
                (short) 1,
                new BigDecimal("2500.00"),
                "Note for future cancelled booking"
        );
        futureCancelled.cancel();

        bookingRepository.saveAll(List.of(futurePaid, futurePending, pastPaid, futureCancelled));

        long count = bookingRepository.countUpcomingPaidOrPendingBookings(club.getId());

        assertEquals(2L, count);
        assertNull(futurePaid.getNote());
    }

    @Test
    void findAllByDateRangeAndClubIdReturnsOverlappingBookingsForClub() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");
        Club otherClub = createClub(city, "OtherClub");

        Client client = createClient("Client", "+7-111-111-11-11");

        Booking overlapping1 = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for overlapping booking 1"
        );
        Booking overlapping2 = new Booking(
                club,
                client,
                at(2026, 1, 1, 11),
                at(2026, 1, 1, 13),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for overlapping booking 2"
        );
        Booking notOverlapping = new Booking(
                club,
                client,
                at(2026, 1, 1, 14),
                at(2026, 1, 1, 16),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for not overlapping booking"
        );
        Booking otherClubBooking = new Booking(
                otherClub,
                client,
                at(2026, 1, 1, 11),
                at(2026, 1, 1, 13),
                (short) 1,
                new BigDecimal("2500.00"),
                "Note for other club booking"
        );

        bookingRepository.saveAll(List.of(overlapping1, overlapping2, notOverlapping, otherClubBooking));

        LocalDateTime start = at(2026, 1, 1, 11);
        LocalDateTime end = at(2026, 1, 1, 13);

        List<Booking> result = bookingRepository.findAllByDateRangeAndClubId(club.getId(), start, end);

        assertEquals(2, result.size());
        List<Long> ids = result.stream().map(Booking::getId).toList();
        assertTrue(ids.contains(overlapping1.getId()));
        assertTrue(ids.contains(overlapping2.getId()));
        assertFalse(ids.contains(notOverlapping.getId()));
        assertFalse(ids.contains(otherClubBooking.getId()));
    }

    @Test
    void existsByDateRangeAndClubIdReturnsTrueIfAnyBookingOverlapsRangeForClub() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client = createClient("Client", "+7-111-111-11-11");

        Booking booking = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking"
        );
        bookingRepository.save(booking);

        boolean exists =
                bookingRepository.existsByDateRangeAndClubId(
                        club.getId(),
                        at(2026, 1, 1, 11),
                        at(2026, 1, 1, 13)
                );

        boolean notExists =
                bookingRepository.existsByDateRangeAndClubId(
                        club.getId(),
                        at(2026, 1, 1, 12),
                        at(2026, 1, 1, 13)
                );

        assertTrue(exists);
        assertFalse(notExists);
    }

    @Test
    void findAllByDateRangeAndClientIdReturnsBookingsForGivenClientOnly() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client1 = createClient("Client1", "+7-111-111-11-11");
        Client client2 = createClient("Client2", "+7-222-222-22-22");

        Booking bookingClient1 = new Booking(
                club,
                client1,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking client 1"
        );
        Booking bookingClient2 = new Booking(
                club,
                client2,
                at(2026, 1, 1, 11),
                at(2026, 1, 1, 13),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking client 2"
        );

        bookingRepository.saveAll(List.of(bookingClient1, bookingClient2));

        LocalDateTime start = at(2026, 1, 1, 0);
        LocalDateTime end = at(2026, 1, 2, 0);

        List<Booking> result =
                bookingRepository.findAllByDateRangeAndClientId(client1.getId(), start, end);

        assertEquals(1, result.size());
        assertEquals(client1.getId(), result.get(0).getClient().getId());
    }

    @Test
    void findAllByDateRangeAndClubIdAndClientPhoneReturnsBookingsForClientPhoneInClub() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client1 = createClient("Client1", "+7-111-111-11-11");
        Client client2 = createClient("Client2", "+7-222-222-22-22");

        Booking bookingClient1 = new Booking(
                club,
                client1,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking client 1"
        );
        Booking bookingClient2 = new Booking(
                club,
                client2,
                at(2026, 1, 1, 11),
                at(2026, 1, 1, 13),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking 2"
        );

        bookingRepository.saveAll(List.of(bookingClient1, bookingClient2));

        LocalDateTime start = at(2026, 1, 1, 0);
        LocalDateTime end = at(2026, 1, 2, 0);

        List<Booking> result =
                bookingRepository.findAllByDateRangeAndClubIdAndClientPhone(
                        club.getId(),
                        start,
                        end,
                        client1.getPhone()
                );

        assertEquals(1, result.size());
        assertEquals(client1.getPhone(), result.get(0).getClient().getPhone());
    }

    @Test
    void findAllByDateRangeAndClientIdPagedReturnsPagedBookingsSortedByStartDateTime() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client = createClient("Client", "+7-111-111-11-11");

        Booking booking1 = new Booking(
                club,
                client,
                at(2026, 1, 3, 10),
                at(2026, 1, 3, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking client 1"
        );
        Booking booking2 = new Booking(
                club,
                client,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking client 1"
        );
        Booking booking3 = new Booking(
                club,
                client,
                at(2026, 1, 2, 10),
                at(2026, 1, 2, 12),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for booking client 1"
        );

        bookingRepository.saveAll(List.of(booking1, booking2, booking3));

        LocalDateTime start = at(2026, 1, 1, 0);
        LocalDateTime end = at(2026, 1, 4, 0);

        PageRequest pageRequest = PageRequest.of(0, 2, Sort.by("startDateTime"));
        Page<Booking> result = bookingRepository.findAllByDateRangeAndClientIdPaged(
                client.getId(),
                start,
                end,
                pageRequest
        );

        assertEquals(3, result.getTotalElements());
        assertEquals(2, result.getTotalPages());
        assertEquals(2, result.getContent().size());
        assertEquals(booking2.getId(), result.getContent().get(0).getId());
        assertEquals(booking3.getId(), result.getContent().get(1).getId());
    }

    @Test
    void findAllByDateRangeAndClubIdPagedReturnsPagedBookingsSortedByStartDateTime() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client1 = createClient("Client1", "+7-111-111-11-11");
        Client client2 = createClient("Client2", "+7-222-222-22-22");

        Booking booking1 = new Booking(
                club,
                client1,
                at(2026, 1, 3, 10),
                at(2026, 1, 3, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        Booking booking2 = new Booking(
                club,
                client2,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking 2"
        );
        Booking booking3 = new Booking(
                club,
                client1,
                at(2026, 1, 2, 10),
                at(2026, 1, 2, 12),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for booking 3"
        );

        bookingRepository.saveAll(List.of(booking1, booking2, booking3));

        LocalDateTime start = at(2026, 1, 1, 0);
        LocalDateTime end = at(2026, 1, 4, 0);

        PageRequest pageRequest = PageRequest.of(0, 2, Sort.by("startDateTime"));
        Page<Booking> result = bookingRepository.findAllByDateRangeAndClubIdPaged(
                club.getId(),
                start,
                end,
                pageRequest
        );

        assertEquals(3, result.getTotalElements());
        assertEquals(2, result.getTotalPages());
        assertEquals(2, result.getContent().size());
        assertEquals(booking2.getId(), result.getContent().get(0).getId());
        assertEquals(booking3.getId(), result.getContent().get(1).getId());
    }

    @Test
    void findAllByDateRangeAndClubIdAndClientPhonePagedReturnsPagedBookingsForClientPhone() {
        Region region = createRegion();
        City city = createCity(region);
        Club club = createClub(city, "Club");

        Client client1 = createClient("Client1", "+7-111-111-11-11");
        Client client2 = createClient("Client2", "+7-222-222-22-22");

        Booking booking1 = new Booking(
                club,
                client1,
                at(2026, 1, 3, 10),
                at(2026, 1, 3, 12),
                (short) 1,
                new BigDecimal("1000.00"),
                "Note for booking 1"
        );
        Booking booking2 = new Booking(
                club,
                client2,
                at(2026, 1, 1, 10),
                at(2026, 1, 1, 12),
                (short) 1,
                new BigDecimal("1500.00"),
                "Note for booking 2"
        );
        Booking booking3 = new Booking(
                club,
                client1,
                at(2026, 1, 2, 10),
                at(2026, 1, 2, 12),
                (short) 1,
                new BigDecimal("2000.00"),
                "Note for booking 3"
        );

        bookingRepository.saveAll(List.of(booking1, booking2, booking3));

        LocalDateTime start = at(2026, 1, 1, 0);
        LocalDateTime end = at(2026, 1, 4, 0);

        PageRequest pageRequest = PageRequest.of(0, 10, Sort.by("startDateTime"));
        Page<Booking> result = bookingRepository.findAllByDateRangeAndClubIdAndClientPhonePaged(
                club.getId(),
                start,
                end,
                client1.getPhone(),
                pageRequest
        );

        assertEquals(2, result.getTotalElements());
        assertEquals(1, result.getTotalPages());
        assertEquals(2, result.getContent().size());
        assertEquals(client1.getPhone(), result.getContent().get(0).getClient().getPhone());
        assertEquals(client1.getPhone(), result.getContent().get(1).getClient().getPhone());
        assertEquals(booking3.getId(), result.getContent().get(0).getId());
        assertEquals(booking1.getId(), result.getContent().get(1).getId());
    }
}

