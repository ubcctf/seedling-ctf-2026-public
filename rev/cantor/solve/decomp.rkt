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

(define (decomp n)
  (define-values (tag rst) (unpair n))
  (match tag
    [0 rst]
    [1 `(flag-idx ,(decomp rst))]
    [2 (let-values ([(a b) (unpair rst)])
         `(and ,(decomp a) ,(decomp b)))]
    [3 (let-values ([(a b) (unpair rst)])
         `(= ,(decomp a) ,(decomp b)))]
    [4 (let-values ([(a b) (unpair rst)])
         `(+ ,(decomp a) ,(decomp b)))]
    [5 (let-values ([(a b) (unpair rst)])
         `(- ,(decomp a) ,(decomp b)))]
    [6 (let-values ([(a b) (unpair rst)])
         `(* ,(decomp a) ,(decomp b)))]
    [7 `(not (decomp rst))]
    [8 (let*-values ([(a rst2) (unpair rst)]
                     [(b c) (unpair rst2)])
         `(if ,(decomp a) ,(decomp b) ,(decomp c)))]
    [9 #t]
    [10 #f]
    [11 'flag-size]
    [_ (error 'eval-n "bad tag: ~a" tag)]))

(decomp flagchecker)
