package ru.andef.andefracing.backend.domain.services.booking;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.andef.andefracing.backend.data.entities.Client;
import ru.andef.andefracing.backend.data.entities.club.Club;
import ru.andef.andefracing.backend.data.entities.club.Price;
import ru.andef.andefracing.backend.data.entities.club.booking.Booking;
import ru.andef.andefracing.backend.data.entities.club.hr.Employee;
import ru.andef.andefracing.backend.data.repositories.club.BookingRepository;
import ru.andef.andefracing.backend.domain.exceptions.EntityNotFoundException;
import ru.andef.andefracing.backend.domain.exceptions.auth.UserNotFoundFromTokenException;
import ru.andef.andefracing.backend.domain.exceptions.booking.InvalidBookingSlotException;
import ru.andef.andefracing.backend.domain.exceptions.booking.NotEnoughSimulatorsException;
import ru.andef.andefracing.backend.domain.services.search.ClientSearchService;
import ru.andef.andefracing.backend.domain.services.search.ClubSearchService;
import ru.andef.andefracing.backend.network.dtos.booking.client.ClientMakeBookingDto;
import ru.andef.andefracing.backend.network.dtos.booking.employee.EmployeeMakeBookingDto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class BookingManagementService {
    private final ClientSearchService clientSearchService;
    private final ClubSearchService clubSearchService;

    private final BookingRepository bookingRepository;

    /**
     * Проверка, что дата окончания позже даты начала
     */
    private void checkStartAndEndDateTime(LocalDateTime start, LocalDateTime end) {
        if (!start.isBefore(end)) {
            throw new InvalidBookingSlotException("Время начала должно быть раньше времени окончания");
        }
    }

    /**
     * Получение цены бронирования
     */
    private BigDecimal getPriceValue(Club club, LocalDateTime start, LocalDateTime end, short cntEquipment) {
        short durationMinutes = (short) Duration.between(start, end).toMinutes();
        for (Price priceInClub : club.getPrices()) {
            if (priceInClub.getDurationMinutes() == durationMinutes) {
                return priceInClub.getValue()
                        .multiply(BigDecimal.valueOf(cntEquipment)).setScale(2, RoundingMode.HALF_EVEN);
            }
        }
        throw new EntityNotFoundException("Цены для кол-ва минут: " + durationMinutes + " нет в клубе");
    }

    /**
     * Сделать бронирование (общий метод для сотрудников и клиентов)
     */
    private void makeBooking(Club club, LocalDateTime start, Supplier<Booking> makeBookingCallback) {
        if (!club.isOpen()) {
            throw new EntityNotFoundException("Клуб закрыт");
        }
        if (start.isBefore(LocalDateTime.now())) {
            throw new InvalidBookingSlotException("Нельзя создать бронирование в прошлом");
        }
        Booking booking = makeBookingCallback.get();
        try {
            bookingRepository.save(booking);
        } catch (Exception e) {
            throw new NotEnoughSimulatorsException();
        }
    }

    /**
     * Сделать бронирование от лица клиента
     */
    @Transactional
    public void makeClientBooking(long clientId, int clubId, ClientMakeBookingDto clientMakeBookingDto) {
        LocalDateTime start = clientMakeBookingDto.getSlot().startDateTime();
        LocalDateTime end = clientMakeBookingDto.getSlot().endDateTime();
        checkStartAndEndDateTime(start, end);
        Client client = clientSearchService
                .findClientByIdOrThrowCustomException(clientId, new UserNotFoundFromTokenException());
        Club club = clubSearchService.findClubById(clubId);
        short cntEquipment = clientMakeBookingDto.getCntEquipment();
        BigDecimal expectedPrice = getPriceValue(club, start, end, cntEquipment);
        String note = clientMakeBookingDto.getNote();
        makeBooking(
                club,
                start,
                () -> client.makeBooking(club, start, end, cntEquipment, expectedPrice, note)
        );
    }

    /**
     * Сделать бронирование от лица сотрудника
     */
    @Transactional
    public void makeEmployeeBooking(long employeeId, int clubId, EmployeeMakeBookingDto employeeMakeBookingDto) {
        LocalDateTime start = employeeMakeBookingDto.getSlot().startDateTime();
        LocalDateTime end = employeeMakeBookingDto.getSlot().endDateTime();
        checkStartAndEndDateTime(start, end);
        Employee employee = clubSearchService
                .findEmployeeByIdOrThrowCustomException(employeeId, new UserNotFoundFromTokenException());
        Club club = clubSearchService.findClubById(clubId);
        short cntEquipment = employeeMakeBookingDto.getCntEquipment();
        BigDecimal expectedPrice = getPriceValue(club, start, end, cntEquipment);
        String note = employeeMakeBookingDto.getNote();
        makeBooking(
                club,
                start,
                () -> employee.makeBooking(club, start, end, cntEquipment, expectedPrice, note)
        );
    }

    /**
     * Подтверждение оплаты бронирования сотрудником
     */
    @Transactional
    public void confirmBookingPaymentByEmployee(long employeeId, int clubId, long bookingId) {
        Employee employee = clubSearchService
                .findEmployeeByIdOrThrowCustomException(employeeId, new UserNotFoundFromTokenException());
        Club club = clubSearchService.findClubById(clubId);
        Booking booking = bookingRepository.findByIdAndClub(bookingId, club)
                .orElseThrow(() ->
                        new EntityNotFoundException("Бронирование не найдено в клубе")
                );
        employee.confirmBookingPayment(booking);
        bookingRepository.save(booking);
    }

    /**
     * Отмена бронирования сотрудником
     */
    @Transactional
    public void cancelBookingByEmployee(long employeeId, int clubId, long bookingId) {
        Employee employee = clubSearchService
                .findEmployeeByIdOrThrowCustomException(employeeId, new UserNotFoundFromTokenException());
        Club club = clubSearchService.findClubById(clubId);
        Booking booking = bookingRepository.findByIdAndClub(bookingId, club)
                .orElseThrow(() ->
                        new EntityNotFoundException("Бронирование не найдено в клубе")
                );
        employee.cancelBooking(booking);
        bookingRepository.save(booking);
    }
}