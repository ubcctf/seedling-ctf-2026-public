#lang racket

(provide pair unpair prog->n)

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

(define (make-flagchecker flag)
  (define (join-conjuncts conjs)
    (match conjs
      ['() #t]
      [(list c) c]
      [_
        (let* ([n (length conjs)]
               [n/2 (quotient n 2)]
               [a (take conjs n/2)]
               [b (drop conjs n/2)])
          `(and ,(join-conjuncts a) ,(join-conjuncts b)))]))

  (let ([conjuncts (for/list ([c flag]
                              [i (in-naturals)])
                     `(= (flag-idx ,i) ,(char->integer c)))])
    `(and (= flag-size ,(string-length flag))
          ,(join-conjuncts conjuncts))))

(define (pair x y)
  (+ (quotient (* (+ x y) (+ x y 1)) 2) y))

(define (unpair z)
  (let* ([w (integer-sqrt (+ 1 (* 8 z)))]
         [s (quotient (- w 1) 2)]
         [t (quotient (* s (+ s 1)) 2)]
         [y (- z t)]
         [x (- s y)])
    (values x y)))

(define (prog->n p)
  (match p
    [(? natural?)       (pair 0 p)]
    [`(flag-idx ,t)     (pair 1 (prog->n t))]
    [`(and ,t1 ,t2)     (pair 2 (pair (prog->n t1) (prog->n t2)))]
    [`(= ,t1 ,t2)       (pair 3 (pair (prog->n t1) (prog->n t2)))]
    [`(+ ,t1 ,t2)       (pair 4 (pair (prog->n t1) (prog->n t2)))]
    [`(- ,t1 ,t2)       (pair 5 (pair (prog->n t1) (prog->n t2)))]
    [`(* ,t1 ,t2)       (pair 6 (pair (prog->n t1) (prog->n t2)))]
    [`(not ,t)          (pair 7 (prog->n t))]
    [`(if ,t1 ,t2 ,t3)  (pair 8 (pair (prog->n t1) (pair (prog->n t2) (prog->n t3))))]
    [#t (pair 9 0)]
    [#f (pair 10 0)]
    ['flag-size (pair 11 0)]))

(make-flagchecker "maple{w3ird_ASTs_4r3_fun}")
(prog->n (make-flagchecker "maple{w3ird_ASTs_4r3_fun}"))
