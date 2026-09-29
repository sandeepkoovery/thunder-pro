<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalarySlip extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'extra_earnings'       => 'array',
        'extra_deductions'     => 'array',
        'basic_stipend'        => 'float',
        'basic_salary'         => 'float',
        'hra'                  => 'float',
        'residuary_choice_pay' => 'float',
        'gross_earnings'       => 'float',
        'ee_pf_contribution'   => 'float',
        'ee_lwf_contribution'  => 'float',
        'recovery_round_off'   => 'float',
        'total_deductions'     => 'float',
        'net_pay'              => 'float',
        'month_date'           => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }

    /**
     * Convert currency number into Indian English words.
     * e.g. 68949.79 -> Sixty-Eight Thousand Nine Hundred Forty-Nine Rupees and Seventy-Nine Paise Only
     */
    public static function numberToWords(float $number): string
    {
        $number = round($number, 2);
        $parts = explode('.', sprintf('%.2f', $number));
        $whole = (int) $parts[0];
        $fraction = (int) ($parts[1] ?? 0);

        $words = self::convertWholeNumber($whole);
        if (empty($words)) {
            $words = 'Zero';
        }

        $result = $words . ' Rupees';

        if ($fraction > 0) {
            $fractionWords = self::convertWholeNumber($fraction);
            $result .= ' and ' . $fractionWords . ' Paise';
        }

        return trim($result) . ' Only';
    }

    private static function convertWholeNumber(int $num): string
    {
        if ($num === 0) {
            return '';
        }

        $ones = [
            1 => 'One', 2 => 'Two', 3 => 'Three', 4 => 'Four', 5 => 'Five',
            6 => 'Six', 7 => 'Seven', 8 => 'Eight', 9 => 'Nine', 10 => 'Ten',
            11 => 'Eleven', 12 => 'Twelve', 13 => 'Thirteen', 14 => 'Fourteen',
            15 => 'Fifteen', 16 => 'Sixteen', 17 => 'Seventeen', 18 => 'Eighteen', 19 => 'Nineteen'
        ];
        $tens = [
            2 => 'Twenty', 3 => 'Thirty', 4 => 'Forty', 5 => 'Fifty',
            6 => 'Sixty', 7 => 'Seventy', 8 => 'Eighty', 9 => 'Ninety'
        ];

        $output = '';

        // Crores (num >= 1,00,00,000)
        if ($num >= 10000000) {
            $crores = intdiv($num, 10000000);
            $output .= self::convertWholeNumber($crores) . ' Crore ';
            $num %= 10000000;
        }

        // Lakhs (num >= 1,00,000)
        if ($num >= 100000) {
            $lakhs = intdiv($num, 100000);
            $output .= self::convertWholeNumber($lakhs) . ' Lakh ';
            $num %= 100000;
        }

        // Thousands (num >= 1,000)
        if ($num >= 1000) {
            $thousands = intdiv($num, 1000);
            $output .= self::convertWholeNumber($thousands) . ' Thousand ';
            $num %= 1000;
        }

        // Hundreds (num >= 100)
        if ($num >= 100) {
            $hundreds = intdiv($num, 100);
            $output .= $ones[$hundreds] . ' Hundred ';
            $num %= 100;
        }

        // Remainder 1 to 99
        if ($num > 0) {
            if ($num < 20) {
                $output .= $ones[$num] . ' ';
            } else {
                $tenDigit = intdiv($num, 10);
                $oneDigit = $num % 10;
                if ($oneDigit > 0) {
                    $output .= $tens[$tenDigit] . '-' . $ones[$oneDigit] . ' ';
                } else {
                    $output .= $tens[$tenDigit] . ' ';
                }
            }
        }

        return trim($output);
    }
}
