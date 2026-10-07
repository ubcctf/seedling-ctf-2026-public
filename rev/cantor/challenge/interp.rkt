#lang racket

(require "flagchecker.rkt")

#|
Language Syntax

t ::= natural?
    | (flag-idx t)
    | (and t t)
    | (= t t)
    | (+ t t)
    | (- t t)
    | (* t t)
    | (not t)
    | (if t t t)
    | #t
    | #f
    | flag-size
|#

(define (pair x y)
  (+ (quotient (* (+ x y) (+ x y 1)) 2) y))

(define (unpair z)
  (let* ([w (integer-sqrt (+ 1 (* 8 z)))]
         [s (quotient (- w 1) 2)]
         [t (quotient (* s (+ s 1)) 2)]
         [y (- z t)]
         [x (- s y)])
    (values x y)))

(define (interp n flag)
  (define-values (tag rst) (unpair n))
  (match tag
    [0 rst]
    [1 (char->integer (string-ref flag (interp rst flag)))]
    [2 (let-values ([(a b) (unpair rst)])
         (and (interp a flag) (interp b flag)))]
    [3 (let-values ([(a b) (unpair rst)])
         (= (interp a flag) (interp b flag)))]
    [4 (let-values ([(a b) (unpair rst)])
         (+ (interp a flag) (interp b flag)))]
    [5 (let-values ([(a b) (unpair rst)])
         (- (interp a flag) (interp b flag)))]
    [6 (let-values ([(a b) (unpair rst)])
         (* (interp a flag) (interp b flag)))]
    [7 (not (interp rst flag))]
    [8 (let*-values ([(a rst2) (unpair rst)]
                     [(b c) (unpair rst2)])
         (if (interp a flag) (interp b flag) (interp c flag)))]
    [9 #t]
    [10 #f]
    [11 (string-length flag)]
    [_ (error 'eval-n "bad tag: ~a" tag)]))

(display "Enter your guess: ")
(define guess (read-line))

(if (interp flagchecker guess)
    (displayln "Yay you guessed it right!")
    (displayln "Not quite :("))
